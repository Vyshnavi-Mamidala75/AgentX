process.env.NODE_ENV = 'test';
import { CandidateLoader } from '../src/loaders/candidateLoader.js';
import { getSessionStore } from '../src/session/sessionStore.js';
import { app } from '../src/server.js';
import { Server } from 'node:http';
import { AddressInfo } from 'node:net';

async function runContractVerification() {
  console.log('====================================================');
  console.log('   PHASE 2: API CONTRACT & SHAPE VERIFICATION       ');
  console.log('====================================================\n');

  const server: Server = app.listen(0);
  const port = (server.address() as AddressInfo).port;
  const baseUrl = `http://localhost:${port}/api/interview`;

  try {
    const rawCandidates = CandidateLoader.getInstance().loadAllRawCandidates();
    const candidate = rawCandidates[0]; // CAND-001
    const testSessionId = `test-session-${Date.now()}`;

    // -------------------------------------------------------------
    // Test 1: Start Interview Request
    // -------------------------------------------------------------
    console.log('1. Testing Start Interview: POST /api/interview');
    const startPayload = {
      sessionId: testSessionId,
      candidate: candidate,
    };
    console.log('-> Request Payload:', JSON.stringify({ sessionId: startPayload.sessionId, candidate: `<${candidate.member.name} Object>` }, null, 2));

    const startRes = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(startPayload),
    });

    const startData = await startRes.json();
    console.log('<- Response Status:', startRes.status);
    console.log('<- Response Body:', JSON.stringify(startData, null, 2));

    // Contract checks
    if (typeof startData.reply !== 'string' || startData.done !== false) {
      throw new Error('Start Interview response failed schema validation!');
    }
    console.log('✔ Start Interview Contract: VALID\n');

    // -------------------------------------------------------------
    // Test 2: Conversation Turn Request
    // -------------------------------------------------------------
    console.log('2. Testing Conversation Turn: POST /api/interview');
    const turnPayload = {
      sessionId: testSessionId,
      message: 'On Day 10, I implemented vector similarity search with ChromaDB and cosine distance.',
    };
    console.log('-> Request Payload:', JSON.stringify(turnPayload, null, 2));

    const turnRes = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(turnPayload),
    });

    const turnData = await turnRes.json();
    console.log('<- Response Status:', turnRes.status);
    console.log('<- Response Body:', JSON.stringify(turnData, null, 2));

    // Contract checks
    if (typeof turnData.reply !== 'string' || turnData.done !== false) {
      throw new Error('Conversation Turn response failed schema validation!');
    }
    console.log('✔ Conversation Turn Contract: VALID\n');

    // -------------------------------------------------------------
    // Test 3: Session Persistence Verification
    // -------------------------------------------------------------
    console.log('3. Verifying In-Memory Session Persistence');
    const session = getSessionStore().getSession(testSessionId);
    console.log(`- Stored candidate name: ${session?.candidateShaped.name}`);
    console.log(`- Stored history turn count: ${session?.history.length}`);
    if (session?.history.length !== 3) { // Welcome + candidate turn + agent turn
      throw new Error(`Expected 3 history items, got ${session?.history.length}`);
    }
    console.log('✔ Session State Persistence: VALID\n');

    // -------------------------------------------------------------
    // Test 4: End Interview & Feedback Structure Verification
    // -------------------------------------------------------------
    console.log('4. Testing End Interview & Feedback Contract Shape');
    getSessionStore().markComplete(testSessionId);

    const endTurnPayload = {
      sessionId: testSessionId,
      message: 'Thank you for the interview.',
    };

    const endRes = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(endTurnPayload),
    });

    const endData = await endRes.json();
    console.log('<- Response Status:', endRes.status);
    console.log('<- Response Body:', JSON.stringify(endData, null, 2));

    // Feedback structure contract checks
    if (
      typeof endData.reply !== 'string' ||
      endData.done !== true ||
      typeof endData.feedback?.summary !== 'string' ||
      !Array.isArray(endData.feedback?.strengths) ||
      !Array.isArray(endData.feedback?.gaps) ||
      !Array.isArray(endData.feedback?.next)
    ) {
      throw new Error('End Interview Feedback response failed schema validation!');
    }
    console.log('✔ End Interview & Feedback Format: VALID\n');

    console.log('====================================================');
    console.log('   ALL PHASE 2 CONTRACT CHECKS PASSED PERFECTLY     ');
    console.log('====================================================');
  } finally {
    server.close();
  }
}

runContractVerification().catch(err => {
  console.error('Phase 2 test failed:', err);
  process.exit(1);
});
