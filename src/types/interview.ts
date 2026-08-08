import { RawCandidate, ShapedCandidate } from './candidate.js';

export interface FeedbackData {
  summary: string;
  strengths: string[];
  gaps: string[];
  next: string[];
}

export interface InterviewStartRequest {
  sessionId: string;
  candidate: RawCandidate;
}

export interface InterviewTurnRequest {
  sessionId: string;
  message: string;
}

export type InterviewRequest = InterviewStartRequest | InterviewTurnRequest;

export interface InterviewResponse {
  reply: string;
  done: boolean;
  feedback?: FeedbackData;
}

export interface MessageTurn {
  role: 'agent' | 'candidate';
  content: string;
  dayReferenced?: number;
  timestamp: number;
}

export interface InterviewSession {
  sessionId: string;
  candidateRaw: RawCandidate;
  candidateShaped: ShapedCandidate;
  history: MessageTurn[];
  coveredDays: Set<number>;
  questionCount: number;
  isComplete: boolean;
  createdAt: number;
  lastUpdatedAt: number;
}
