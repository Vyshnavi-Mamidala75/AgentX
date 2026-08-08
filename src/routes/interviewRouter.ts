import { Router, Request, Response } from 'express';
import { getSessionStore } from '../session/sessionStore.js';
import { InterviewResponse, FeedbackData } from '../types/interview.js';
import { RawCandidate } from '../types/candidate.js';

export const interviewRouter = Router();

/**
 * Single endpoint contract: POST /api/interview
 * Matches technical-spec.md strictly:
 * 1. Start Interview: { sessionId: string, candidate: RawCandidate }
 *    -> { reply: string, done: false }
 * 2. Conversation Turn: { sessionId: string, message: string }
 *    -> { reply: string, done: false }
 * 3. End Interview:
 *    -> { reply: string, done: true, feedback: { summary, strengths, gaps, next } }
 */
interviewRouter.post('/interview', async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId, candidate, message } = req.body;

    if (!sessionId || typeof sessionId !== 'string') {
      res.status(400).json({ error: 'Missing or invalid "sessionId" in request body.' });
      return;
    }

    const sessionStore = getSessionStore();
    let session = sessionStore.getSession(sessionId);

    // 1. Start Interview (First Request)
    if (candidate) {
      if (!candidate.member || !candidate.missions || !candidate.signals) {
        res.status(400).json({ error: 'Invalid candidate object format.' });
        return;
      }

      session = sessionStore.createSession(sessionId, candidate as RawCandidate);

      // Record welcome message
      const initialReply = `Welcome, ${session.candidateShaped.name}. Let's begin your technical interview on your cohort journey.`;
      sessionStore.addTurn(sessionId, {
        role: 'agent',
        content: initialReply,
        timestamp: Date.now(),
      });

      const response: InterviewResponse = {
        reply: initialReply,
        done: false,
      };

      res.status(200).json(response);
      return;
    }

    // 2. Subsequent Conversation Turn
    if (!session) {
      res.status(404).json({
        error: `Session "${sessionId}" not found. You must initialize the session with a candidate object first.`,
      });
      return;
    }

    if (message === undefined || typeof message !== 'string') {
      res.status(400).json({ error: 'Missing or invalid "message" in request body.' });
      return;
    }

    // Record candidate message turn
    sessionStore.addTurn(sessionId, {
      role: 'candidate',
      content: message,
      timestamp: Date.now(),
    });

    // Check if session is already completed
    if (session.isComplete) {
      const stubFeedback: FeedbackData = {
        summary: `Interview session with ${session.candidateShaped.name} has concluded.`,
        strengths: ['Demonstrated understanding of core concepts.'],
        gaps: ['Need deeper exploration of deployment and scaling.'],
        next: ['Review containerization and multi-agent coordination.'],
      };

      const finalResponse: InterviewResponse = {
        reply: 'Interview completed.',
        done: true,
        feedback: stubFeedback,
      };

      res.status(200).json(finalResponse);
      return;
    }

    // Phase 2: Stub reply for testing the contract shape
    // In Phase 3, this will be replaced by Gemini interview engine.
    const replyStub = `Thank you for sharing that context on your progress. Let's dig deeper into your experience.`;

    sessionStore.addTurn(sessionId, {
      role: 'agent',
      content: replyStub,
      timestamp: Date.now(),
    });

    const response: InterviewResponse = {
      reply: replyStub,
      done: false,
    };

    res.status(200).json(response);
  } catch (error: any) {
    console.error('Error handling /api/interview:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});
