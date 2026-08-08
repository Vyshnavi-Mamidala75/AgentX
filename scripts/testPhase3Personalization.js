import { CandidateLoader } from '../src/loaders/candidateLoader.js';
import { app } from '../src/server.js';
async function runCandidateInterview(baseUrl, candidateId, candidateAnswers) {
    const loader = CandidateLoader.getInstance();
    const candidate = loader.loadAllRawCandidates().find(c => c.member.id === candidateId);
    if (!candidate)
        throw new Error(`Candidate ${candidateId} not found`);
    const sessionId = `test-${candidateId}-${Date.now()}`;
    console.log(`\n======================================================================`);
    console.log(` INTERVIEW SIMULATION: ${candidate.member.name} (${candidate.member.id})`);
    console.log(` Role: ${candidate.member.jobRole} | First-Try: ${candidate.signals.missionsFirstTry}/${candidate.signals.missionsCompleted} | Commits: ${candidate.signals.commitDays}/31`);
    console.log(`======================================================================`);
    // 1. Start Interview
    const startRes = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, candidate }),
    });
    const startData = await startRes.json();
    console.log(`\n[Agent Q1]: ${startData.reply}`);
    const questions = [startData.reply];
    // 2. Run multi-turn conversation
    for (let i = 0; i < candidateAnswers.length; i++) {
        const answer = candidateAnswers[i];
        console.log(`\n[Candidate A${i + 1}]: "${answer}"`);
        const turnRes = await fetch(baseUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId, message: answer }),
        });
        const turnData = await turnRes.json();
        if (turnData.done) {
            console.log(`\n[Agent Final Conclusion]: ${turnData.reply}`);
            console.log(`[Status]: Interview Completed (done: true)`);
            break;
        }
        else {
            console.log(`\n[Agent Q${i + 2}]: ${turnData.reply}`);
            questions.push(turnData.reply);
        }
    }
    return questions;
}
async function main() {
    const PORT = 3088;
    const server = app.listen(PORT);
    const baseUrl = `http://localhost:${PORT}/api/interview`;
    try {
        // 1. Isabella Rossi (CAND-016) answers
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
        // 2. Emily Chen (CAND-003) answers
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
        const isabellaQuestions = await runCandidateInterview(baseUrl, 'CAND-016', isabellaAnswers);
        const emilyQuestions = await runCandidateInterview(baseUrl, 'CAND-003', emilyAnswers);
        console.log('\n\n======================================================================');
        console.log(' SIDE-BY-SIDE PERSONALIZATION COMPARISON');
        console.log('======================================================================\n');
        console.log('ISABELLA ROSSI (CAND-016 - Struggled/Retried Missions):');
        isabellaQuestions.forEach((q, idx) => console.log(`  [Q${idx + 1}] ${q}`));
        console.log('\nEMILY CHEN (CAND-003 - Mastered 1st Try 96.8%):');
        emilyQuestions.forEach((q, idx) => console.log(`  [Q${idx + 1}] ${q}`));
    }
    finally {
        server.close();
    }
}
main().catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
});
