import { Router, Request, Response } from 'express';
import { getSessionStore } from '../session/sessionStore.js';
import { InterviewResponse } from '../types/interview.js';
import { RawCandidate } from '../types/candidate.js';
import { getInterviewEngine } from '../interview/interviewEngine.js';
import { getFeedbackGenerator } from '../interview/feedbackGenerator.js';

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
    const interviewEngine = getInterviewEngine();
    const feedbackGenerator = getFeedbackGenerator();
    let session = sessionStore.getSession(sessionId);

    // 1. Start Interview (First Request)
    if (candidate) {
      if (!candidate.member || !candidate.missions || !candidate.signals) {
        res.status(400).json({ error: 'Invalid candidate object format.' });
        return;
      }

      session = sessionStore.createSession(sessionId, candidate as RawCandidate);

      // Generate personalized opening question using candidate signals
      const openingResult = await interviewEngine.generateOpeningQuestion(session);

      sessionStore.addTurn(sessionId, {
        role: 'agent',
        content: openingResult.reply,
        dayReferenced: openingResult.dayReferenced,
        timestamp: Date.now(),
      });

      const response: InterviewResponse = {
        reply: openingResult.reply,
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
      const feedback = await feedbackGenerator.generateFeedback(session);
      const finalResponse: InterviewResponse = {
        reply: 'Interview completed.',
        done: true,
        feedback,
      };

      res.status(200).json(finalResponse);
      return;
    }

    // Generate intelligent, signal-personalized follow-up question
    const turnResult = await interviewEngine.generateFollowUpQuestion(session, message);

    if (turnResult.isComplete) {
      sessionStore.markComplete(sessionId);

      // Generate full structured feedback / scorecard
      const feedback = await feedbackGenerator.generateFeedback(session);

      const finalResponse: InterviewResponse = {
        reply: turnResult.reply,
        done: true,
        feedback,
      };

      res.status(200).json(finalResponse);
      return;
    }

    // Record agent question
    sessionStore.addTurn(sessionId, {
      role: 'agent',
      content: turnResult.reply,
      dayReferenced: turnResult.dayReferenced,
      timestamp: Date.now(),
    });

    const response: InterviewResponse = {
      reply: turnResult.reply,
      done: false,
    };

    res.status(200).json(response);
  } catch (error: any) {
    console.error('Error handling /api/interview:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});
