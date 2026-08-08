import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  RawCandidate,
  ShapedCandidate,
  ShapedMission,
  MissionOutcome,
  CandidatePerformanceProfile,
} from '../types/candidate.js';
import { loadCurriculum } from './curriculumLoader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class CandidateLoader {
  private static instance: CandidateLoader | null = null;
  private candidatesCache: RawCandidate[] | null = null;

  public static getInstance(): CandidateLoader {
    if (!CandidateLoader.instance) {
      CandidateLoader.instance = new CandidateLoader();
    }
    return CandidateLoader.instance;
  }

  public findCandidatesFile(): string {
    const candidatePaths = [
      path.resolve(process.cwd(), 'data/candidates.json'),
      path.resolve(process.cwd(), 'candidates.json'),
      path.resolve(__dirname, '../../data/candidates.json'),
      path.resolve(__dirname, '../../candidates.json'),
    ];

    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        return p;
      }
    }
    throw new Error(`Candidates file not found in paths: ${candidatePaths.join(', ')}`);
  }

  public loadAllRawCandidates(): RawCandidate[] {
    if (this.candidatesCache) {
      return this.candidatesCache;
    }

    const filePath = this.findCandidatesFile();
    const rawData = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(rawData);

    this.candidatesCache = parsed.candidates || [];
    return this.candidatesCache!;
  }

  public getRawCandidateById(candidateId: string): RawCandidate | undefined {
    const candidates = this.loadAllRawCandidates();
    return candidates.find(c => c.member.id === candidateId);
  }

  /**
   * Transforms and enriches a RawCandidate object into a ShapedCandidate
   * containing computed performance signals, curriculum mappings, and targeted probing areas.
   */
  public shapeCandidate(raw: RawCandidate): ShapedCandidate {
    const curriculum = loadCurriculum();
    const missionByDay: Record<number, ShapedMission> = {};

    const shapedMissions: ShapedMission[] = raw.missions.map(m => {
      let outcome: MissionOutcome = 'unknown';
      const attemptsCount = m.attempts ?? (m.passed ? 1 : 0);

      if (m.skipped) {
        outcome = 'skipped';
      } else if (m.passed === false) {
        outcome = 'failed';
      } else if (m.passed === true) {
        outcome = attemptsCount === 1 ? 'passed_first_try' : 'passed_multi_attempt';
      }

      const curriculumDay = curriculum.getDay(m.day);
      const shapedMission: ShapedMission = {
        ...m,
        outcome,
        attemptsCount,
        curriculumContext: curriculumDay
          ? {
              moduleTitle: curriculumDay.moduleTitle || 'General',
              moduleNumber: curriculumDay.moduleNumber || 0,
              tools: curriculumDay.tools || [],
              objectives: curriculumDay.objectives || [],
            }
          : undefined,
      };

      missionByDay[m.day] = shapedMission;
      return shapedMission;
    });

    // Categorize performance
    const struggleMissions = shapedMissions.filter(
      m => m.outcome === 'failed' || m.attemptsCount >= 3
    );
    const masteryMissions = shapedMissions.filter(
      m => m.outcome === 'passed_first_try'
    );
    const skippedMissions = shapedMissions.filter(
      m => m.outcome === 'skipped'
    );
    const passedCount = shapedMissions.filter(
      m => m.outcome === 'passed_first_try' || m.outcome === 'passed_multi_attempt'
    ).length;
    const failedCount = shapedMissions.filter(m => m.outcome === 'failed').length;
    const skippedCount = skippedMissions.length;

    const totalDaysInCohort = 31;
    const performance: CandidatePerformanceProfile = {
      totalMissionsTracked: shapedMissions.length,
      passedCount,
      failedCount,
      skippedCount,
      struggleMissions,
      masteryMissions,
      skippedMissions,
      firstTrySuccessRate:
        raw.signals.missionsCompleted > 0
          ? Number(((raw.signals.missionsFirstTry / raw.signals.missionsCompleted) * 100).toFixed(1))
          : 0,
      completionRate: Number(((raw.signals.missionsCompleted / totalDaysInCohort) * 100).toFixed(1)),
      consistencyScore: Number(((raw.signals.commitDays / totalDaysInCohort) * 100).toFixed(1)),
    };

    // Formulate targeted probing suggestions
    const suggestedStruggles = struggleMissions.map(m => {
      const reason = m.outcome === 'failed' ? `Failed (attempted ${m.attemptsCount}x)` : `Struggled (${m.attemptsCount} attempts)`;
      return `Day ${m.day}: "${m.title}" (${reason})`;
    });

    const suggestedStrengths = masteryMissions.map(m => {
      return `Day ${m.day}: "${m.title}" (1st try pass)`;
    });

    const suggestedGaps = skippedMissions.map(m => {
      return `Day ${m.day}: "${m.title}" (Skipped)`;
    });

    return {
      id: raw.member.id,
      name: raw.member.name,
      jobRole: raw.member.jobRole,
      yearsExperience: raw.member.yearsExperience,
      education: raw.member.education,
      status: raw.member.status,
      signals: raw.signals,
      performance,
      missions: shapedMissions,
      missionByDay,
      probedTopics: {
        suggestedStruggles,
        suggestedStrengths,
        suggestedGaps,
      },
    };
  }

  public getShapedCandidateById(candidateId: string): ShapedCandidate | undefined {
    const raw = this.getRawCandidateById(candidateId);
    if (!raw) return undefined;
    return this.shapeCandidate(raw);
  }
}

export const loadCandidateById = (candidateId: string): ShapedCandidate | undefined => {
  return CandidateLoader.getInstance().getShapedCandidateById(candidateId);
};

export const shapeCandidate = (raw: RawCandidate): ShapedCandidate => {
  return CandidateLoader.getInstance().shapeCandidate(raw);
};
