export interface CurriculumModule {
  n: number;
  title: string;
  days: [number, number]; // [startDay, endDay]
}

export interface CurriculumDay {
  day: number;
  title: string;
  type: string; // "SETUP" | "FOUNDATION" | "CORE" | "PROJECT" | "EVALUATION" | "CAPSTONE"
  tools: string[];
  objectives: string[];
  moduleNumber?: number;
  moduleTitle?: string;
}

export interface RawCurriculum {
  cohort: string;
  modules: CurriculumModule[];
  days: CurriculumDay[];
}

export interface EnrichedCurriculum {
  cohort: string;
  modules: CurriculumModule[];
  days: Map<number, CurriculumDay>;
  getDay(dayNumber: number): CurriculumDay | undefined;
  getDaysByModule(moduleNumber: number): CurriculumDay[];
}
