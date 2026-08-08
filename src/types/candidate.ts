import { CurriculumDay } from './curriculum.js';

export interface CandidateMember {
  id: string;
  name: string;
  jobRole: string;
  yearsExperience: number;
  education: string;
  status: string;
}

export interface RawMission {
  day: number;
  title: string;
  passed?: boolean;
  skipped?: boolean;
  attempts?: number;
}

export interface CandidateSignals {
  commitDays: number;
  missionsCompleted: number;
  missionsFirstTry: number;
}

export interface RawCandidate {
  member: CandidateMember;
  missions: RawMission[];
  signals: CandidateSignals;
}

export type MissionOutcome = 'passed_first_try' | 'passed_multi_attempt' | 'failed' | 'skipped' | 'unknown';

export interface ShapedMission extends RawMission {
  outcome: MissionOutcome;
  attemptsCount: number;
  curriculumContext?: {
    moduleTitle: string;
    moduleNumber: number;
    tools: string[];
    objectives: string[];
  };
}

export interface CandidatePerformanceProfile {
  totalMissionsTracked: number;
  passedCount: number;
  failedCount: number;
  skippedCount: number;
  struggleMissions: ShapedMission[]; // attempts >= 3 or passed === false
  masteryMissions: ShapedMission[];  // passed === true && attempts === 1
  skippedMissions: ShapedMission[];  // skipped === true
  firstTrySuccessRate: number;       // percentage of first-try missions
  completionRate: number;            // missions completed / 31
  consistencyScore: number;          // commitDays / 31
}

export interface ShapedCandidate {
  id: string;
  name: string;
  jobRole: string;
  yearsExperience: number;
  education: string;
  status: string;
  signals: CandidateSignals;
  performance: CandidatePerformanceProfile;
  missions: ShapedMission[];
  missionByDay: Record<number, ShapedMission>;
  probedTopics: {
    suggestedStruggles: string[]; // specific topics to probe deeper into difficulties
    suggestedStrengths: string[]; // specific topics to probe for advanced technical depth
    suggestedGaps: string[];      // skipped or unaddressed curriculum areas
  };
}
