import { RawCandidate, ShapedCandidate } from '../types/candidate.js';
import { InterviewSession, MessageTurn } from '../types/interview.js';
import { shapeCandidate } from '../loaders/candidateLoader.js';

export class SessionStore {
  private static instance: SessionStore | null = null;
  private sessions: Map<string, InterviewSession> = new Map();

  public static getInstance(): SessionStore {
    if (!SessionStore.instance) {
      SessionStore.instance = new SessionStore();
    }
    return SessionStore.instance;
  }

  public getSession(sessionId: string): InterviewSession | undefined {
    return this.sessions.get(sessionId);
  }

  public createSession(sessionId: string, candidateRaw: RawCandidate): InterviewSession {
    const shaped = shapeCandidate(candidateRaw);
    const now = Date.now();
    const session: InterviewSession = {
      sessionId,
      candidateRaw,
      candidateShaped: shaped,
      history: [],
      coveredDays: new Set<number>(),
      questionCount: 0,
      isComplete: false,
      createdAt: now,
      lastUpdatedAt: now,
    };
    this.sessions.set(sessionId, session);
    return session;
  }

  public addTurn(sessionId: string, turn: MessageTurn): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    session.history.push(turn);
    session.lastUpdatedAt = Date.now();

    if (turn.role === 'agent') {
      session.questionCount += 1;
    }
    if (turn.dayReferenced !== undefined) {
      session.coveredDays.add(turn.dayReferenced);
    }
    return true;
  }

  public markComplete(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    session.isComplete = true;
    session.lastUpdatedAt = Date.now();
    return true;
  }

  public deleteSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  public clearAll(): void {
    this.sessions.clear();
  }
}

export const getSessionStore = (): SessionStore => {
  return SessionStore.getInstance();
};
