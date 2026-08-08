import { CandidateLoader } from '../src/loaders/candidateLoader.js';
import { app } from '../src/server.js';
import { Server } from 'node:http';

async function testEdgeCaseFlow() {
  console.log('======================================================================');
  console.log('         PHASE 6: EDGE CASES VERIFICATION TEST                        ');
  console.log('======================================================================\n');

  const PORT = 3066;
  const server: Server = app.listen(PORT);
  const baseUrl = `http://localhost:${PORT}/api/interview`;

  try {
    const rawCandidates = CandidateLoader.getInstance().loadAllRawCandidates();
    const candidate = rawCandidates.find(c => c.member.id === 'CAND-016') || rawCandidates[0];
    const sessionId = `edge-case-session-${Date.now()}`;

    // 1. Start Interview
    console.log('1. Starting Interview with CAND-016 (Isabella Rossi)...');
    const startRes = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, candidate }),
    });
    const startData = await startRes.json();
    console.log(`[Interviewer Q1]: ${startData.reply}\n`);

    // Edge case sequence to test
    const edgeCases = [
      { type: 'One-Word Answer', input: 'FastAPI' },
      { type: 'Uncertainty / "I don\'t know"', input: 'I don\'t know, I am not really sure about this.' },
      { type: 'Off-Topic Answer', input: 'I really enjoy eating pepperoni pizza while watching football.' },
      { type: 'Single-Character / Ultra-brief', input: 'ok' },
      { type: 'Technical Detailed Response', input: 'For LangGraph, I used StateGraph with conditional edges and a router agent.' },
      { type: 'Another "Unsure" Response', input: 'I have no idea about Kubernetes ingress controllers.' },
      { type: 'Another One-Word Response', input: 'Docker' },
      { type: 'Final Technical Answer', input: 'We deployed our capstone chatbot with health checks and SQLite persistent storage.' },
    ];

    let lastTurn = startData;

    for (let i = 0; i < edgeCases.length; i++) {
      const { type, input } = edgeCases[i];
      console.log(`----------------------------------------------------------------------`);
      console.log(`[Candidate Turn ${i + 1} (${type})]: "${input}"`);

      const turnRes = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message: input }),
      });

      if (!turnRes.ok) {
        throw new Error(`Turn ${i + 1} failed with status ${turnRes.status}`);
      }

      lastTurn = await turnRes.json();

      if (lastTurn.done) {
        console.log(`\n[Agent Conclusion]: ${lastTurn.reply}`);
        console.log(`[Feedback Summary]: ${lastTurn.feedback?.summary}`);
        console.log(`✔ Reached Interview Conclusion (done: true)`);
        break;
      } else {
        console.log(`[Agent Follow-Up Q${i + 2}]: ${lastTurn.reply}`);
      }
    }

    if (
      lastTurn.done !== true ||
      !lastTurn.feedback ||
      !Array.isArray(lastTurn.feedback.strengths) ||
      !Array.isArray(lastTurn.feedback.gaps)
    ) {
      throw new Error('Interview failed to complete properly with feedback under edge cases!');
    }

    console.log('\n======================================================================');
    console.log(' ALL EDGE CASES HANDLED ROBUSTLY AND GRACEFULLY WITHOUT CRASHING      ');
    console.log('======================================================================');
  } finally {
    server.close();
  }
}

testEdgeCaseFlow().catch(err => {
  console.error('Edge case test failed:', err);
  process.exit(1);
});
