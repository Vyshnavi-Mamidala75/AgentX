process.env.NODE_ENV = 'test';
import { CandidateLoader } from '../src/loaders/candidateLoader.js';
import { app } from '../src/server.js';
import { Server } from 'node:http';
import { AddressInfo } from 'node:net';

async function testCandidateFeedback(baseUrl: string, candidateId: string, candidateAnswers: string[]) {
  const loader = CandidateLoader.getInstance();
  const candidate = loader.loadAllRawCandidates().find(c => c.member.id === candidateId);
  if (!candidate) throw new Error(`Candidate ${candidateId} not found`);

  const sessionId = `feedback-test-${candidateId}-${Date.now()}`;

  // Start interview
  const startRes = await fetch(baseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, candidate }),
  });
  const startData = await startRes.json();

  let lastResponse = startData;

  // Answer questions until done: true
  for (let i = 0; i < candidateAnswers.length; i++) {
    const turnRes = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, message: candidateAnswers[i] }),
    });
    lastResponse = await turnRes.json();
    if (lastResponse.done) break;
  }

  return lastResponse;
}

async function main() {
  console.log('======================================================================');
  console.log('       PHASE 4: FEEDBACK & SCORECARD GENERATION VERIFICATION          ');
  console.log('======================================================================\n');

  const server: Server = app.listen(0);
  const port = (server.address() as AddressInfo).port;
  const baseUrl = `http://localhost:${port}/api/interview`;

  try {
    const isabellaAnswers = [
      "For embeddings, I initially struggled because cosine distance was giving poor clustering with high-dimensional vectors, and I had bugs in batch tensor normalization.",
      "To fix that, I reduced dimensions with PCA and switched to normalized sentence-transformer embeddings to inspect cosine similarity distributions.",
      "In Vector DBs, Chroma worked locally, but when indexing large document sets I faced memory exhaustion because chunk sizes were too large.",
      "With Prompt Engineering on Day 12, my prompts failed because few-shot examples were leaking invalid JSON formats, so the schema validator rejected outputs.",
      "On Day 22 with multi-agent orchestration, the router agent was getting stuck in infinite loops between specialized healthcare agents without terminating properly.",
      "I solved the looping by adding a max-iteration guardrail and explicit state checkpoints in LangGraph.",
      "I skipped Day 27 Security because of time constraints, but I understand input sanitization and prompt-injection guardrails conceptually.",
      "For Day 31 Capstone, I pulled everything together into a FastAPI backend with session history and Chroma retrieval.",
    ];

    const emilyAnswers = [
      "On Day 7, I used text-embedding-3-small with 512-token chunks and 10% overlap to optimize retrieval precision against latency.",
      "We benchmarked cosine distance vs inner product on ChromaDB and found normalized inner product gave a 15% latency reduction under concurrent load.",
      "For Day 10 retrieval, I implemented a hybrid dense-sparse search combining BM25 keyword matching with dense vectors and reciprocal rank fusion.",
      "On Day 13 function calling, I strictly defined Pydantic JSON schemas with enum constraints to guarantee zero format hallucination.",
      "On Day 21 and 22, I designed LangGraph state machines with deterministic routing conditions and circuit breakers for agent fallback.",
      "For Day 23 Model Context Protocol, I created custom MCP tool servers allowing agents to safely query private healthcare databases.",
      "On Day 28, I containerized the services with multi-stage Docker builds and deployed helm charts with HPA configured for autoscaling.",
      "For the Capstone demo on Day 31, our system achieved sub-400ms end-to-end response times with 99.2% retrieval accuracy.",
    ];

    // 1. Isabella Rossi (CAND-016)
    const isabellaResult = await testCandidateFeedback(baseUrl, 'CAND-016', isabellaAnswers);
    console.log('----------------------------------------------------------------------');
    console.log('FINAL FEEDBACK OBJECT FOR CAND-016 (Isabella Rossi):');
    console.log('----------------------------------------------------------------------');
    console.log(JSON.stringify(isabellaResult, null, 2));

    // Validate schema
    if (
      isabellaResult.done !== true ||
      typeof isabellaResult.feedback?.summary !== 'string' ||
      !Array.isArray(isabellaResult.feedback?.strengths) ||
      !Array.isArray(isabellaResult.feedback?.gaps) ||
      !Array.isArray(isabellaResult.feedback?.next)
    ) {
      throw new Error('CAND-016 feedback did not meet schema requirements!');
    }
    console.log('✔ CAND-016 Feedback Schema: VALID\n');

    // 2. Emily Chen (CAND-003)
    const emilyResult = await testCandidateFeedback(baseUrl, 'CAND-003', emilyAnswers);
    console.log('----------------------------------------------------------------------');
    console.log('FINAL FEEDBACK OBJECT FOR CAND-003 (Emily Chen):');
    console.log('----------------------------------------------------------------------');
    console.log(JSON.stringify(emilyResult, null, 2));

    // Validate schema
    if (
      emilyResult.done !== true ||
      typeof emilyResult.feedback?.summary !== 'string' ||
      !Array.isArray(emilyResult.feedback?.strengths) ||
      !Array.isArray(emilyResult.feedback?.gaps) ||
      !Array.isArray(emilyResult.feedback?.next)
    ) {
      throw new Error('CAND-003 feedback did not meet schema requirements!');
    }
    console.log('✔ CAND-003 Feedback Schema: VALID\n');

    console.log('======================================================================');
    console.log(' ALL PHASE 4 FEEDBACK & SCORECARD TESTS PASSED PERFECTLY             ');
    console.log('======================================================================');
  } finally {
    server.close();
  }
}

main().catch(err => {
  console.error('Phase 4 test failed:', err);
  process.exit(1);
});
