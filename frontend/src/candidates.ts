export interface CandidateOption {
  id: string;
  name: string;
  jobRole: string;
  yearsExperience: number;
  education: string;
  status: string;
  missions: any[];
  signals: {
    commitDays: number;
    missionsCompleted: number;
    missionsFirstTry: number;
  };
}

// Full candidate pool embedded for fast client initialization
import candidatesData from '../../data/candidates.json';

export const ALL_CANDIDATES: CandidateOption[] = candidatesData.candidates as any[];
