import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { RawCurriculum, CurriculumDay, CurriculumModule, EnrichedCurriculum } from '../types/curriculum.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class CurriculumLoader {
  private static instance: CurriculumLoader | null = null;
  private enrichedCurriculum: EnrichedCurriculum | null = null;

  public static getInstance(): CurriculumLoader {
    if (!CurriculumLoader.instance) {
      CurriculumLoader.instance = new CurriculumLoader();
    }
    return CurriculumLoader.instance;
  }

  public findCurriculumFile(): string {
    const candidatePaths = [
      path.resolve(process.cwd(), 'data/curriculum.json'),
      path.resolve(process.cwd(), 'curriculum.json'),
      path.resolve(__dirname, '../../data/curriculum.json'),
      path.resolve(__dirname, '../../curriculum.json'),
    ];

    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        return p;
      }
    }
    throw new Error(`Curriculum file not found in paths: ${candidatePaths.join(', ')}`);
  }

  public loadCurriculum(): EnrichedCurriculum {
    if (this.enrichedCurriculum) {
      return this.enrichedCurriculum;
    }

    const filePath = this.findCurriculumFile();
    const rawData = fs.readFileSync(filePath, 'utf-8');
    const parsed: RawCurriculum = JSON.parse(rawData);

    const dayMap = new Map<number, CurriculumDay>();

    // Map modules to find which module a day belongs to
    const findModuleForDay = (dayNum: number): CurriculumModule | undefined => {
      return parsed.modules.find(m => dayNum >= m.days[0] && dayNum <= m.days[1]);
    };

    for (const d of parsed.days) {
      const module = findModuleForDay(d.day);
      const enrichedDay: CurriculumDay = {
        ...d,
        moduleNumber: module ? module.n : undefined,
        moduleTitle: module ? module.title : undefined,
      };
      dayMap.set(d.day, enrichedDay);
    }

    this.enrichedCurriculum = {
      cohort: parsed.cohort,
      modules: parsed.modules,
      days: dayMap,
      getDay(dayNumber: number): CurriculumDay | undefined {
        return dayMap.get(dayNumber);
      },
      getDaysByModule(moduleNumber: number): CurriculumDay[] {
        return Array.from(dayMap.values()).filter(d => d.moduleNumber === moduleNumber);
      },
    };

    return this.enrichedCurriculum;
  }
}

export const loadCurriculum = (): EnrichedCurriculum => {
  return CurriculumLoader.getInstance().loadCurriculum();
};
