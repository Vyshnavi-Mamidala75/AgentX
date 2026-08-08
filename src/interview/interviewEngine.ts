import { GoogleGenAI } from '@google/genai';
import { InterviewSession, MessageTurn } from '../types/interview.js';
import { ShapedMission } from '../types/candidate.js';
import { loadCurriculum } from '../loaders/curriculumLoader.js';

export interface GeneratedQuestionResult {
  reply: string;
  dayReferenced?: number;
  isComplete: boolean;
}

export class InterviewEngine {
  private static instance: InterviewEngine | null = null;
  private ai: GoogleGenAI | null = null;
  private modelName: string = 'gemini-2.5-flash';

  private constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.ai = new GoogleGenAI({ apiKey });
    }
  }

  public static getInstance(): InterviewEngine {
    if (!InterviewEngine.instance) {
      InterviewEngine.instance = new InterviewEngine();
    }
    return InterviewEngine.instance;
  }

  /**
   * Selects target curriculum days for interview coverage based on candidate signals.
   * Ensures at least 4 distinct curriculum days are covered across the interview.
   */
  public selectTargetDays(session: InterviewSession): number[] {
    const candidate = session.candidateShaped;
    const targetDays: number[] = [];

    // 1. If candidate has struggles (failed or multi-attempt), prioritize those
    const struggleDays = candidate.performance.struggleMissions.map(m => m.day);
    for (const d of struggleDays) {
      if (!targetDays.includes(d)) targetDays.push(d);
    }

    // 2. Add skipped topics if any
    const skippedDays = candidate.performance.skippedMissions.map(m => m.day);
    for (const d of skippedDays) {
      if (!targetDays.includes(d)) targetDays.push(d);
    }

    // 3. Add mastery topics (for depth and advanced probing)
    const masteryDays = candidate.performance.masteryMissions.map(m => m.day);
    for (const d of masteryDays) {
      if (!targetDays.includes(d)) targetDays.push(d);
    }

    // 4. Fallback defaults if candidate had sparse data
    const standardDays = [7, 10, 12, 16, 22, 23, 28, 31];
    for (const d of standardDays) {
      if (!targetDays.includes(d)) targetDays.push(d);
    }

    return targetDays;
  }

  /**
   * Determines the active curriculum day to focus on for the current turn.
   */
  public determineCurrentDay(session: InterviewSession): number {
    const targetDays = this.selectTargetDays(session);
    const covered = Array.from(session.coveredDays);

    // If we haven't covered at least 4 days and have asked questions, pick next uncovered target day
    const uncovered = targetDays.filter(d => !session.coveredDays.has(d));
    
    // We rotate or deepen every 1-2 questions
    const turnsOnCurrentTopic = session.history.filter(
      h => h.role === 'agent' && h.dayReferenced === session.history[session.history.length - 1]?.dayReferenced
    ).length;

    if (uncovered.length > 0 && (turnsOnCurrentTopic >= 2 || session.questionCount === 0 || covered.length === 0)) {
      return uncovered[0];
    }

    // Otherwise stay on current or pick first target day
    return uncovered[0] || targetDays[0] || 7;
  }

  /**
   * Generates the initial interview greeting and opening technical question.
   */
  public async generateOpeningQuestion(session: InterviewSession): Promise<GeneratedQuestionResult> {
    const candidate = session.candidateShaped;
    const targetDay = this.determineCurrentDay(session);
    const curriculum = loadCurriculum();
    const dayInfo = curriculum.getDay(targetDay);

    const isHighPerformer = candidate.performance.firstTrySuccessRate >= 80;
    const hasStruggles = candidate.performance.struggleMissions.length > 0;

    const systemPrompt = `You are a rigorous, encouraging, and highly technical Lead AI Engineer conducting a personalized multi-turn technical interview for a candidate who completed a 31-day AI engineering cohort.

CANDIDATE CONTEXT:
- Name: ${candidate.name}
- Background: ${candidate.jobRole} (${candidate.yearsExperience} yrs exp, ${candidate.education})
- Cohort Commitment: ${candidate.signals.commitDays}/31 days active
- First-Try Pass Rate: ${candidate.performance.firstTrySuccessRate}% (${candidate.signals.missionsFirstTry}/${candidate.signals.missionsCompleted} completed missions)
- Performance Profile: ${isHighPerformer ? 'TOP PERFORMER (passed almost everything first try). Ask deep architectural and trade-off questions.' : 'MIXED PROFILE (had multiple attempts or skipped certain missions). Probe on problem-solving, root causes of struggle, and conceptual foundations.'}
${hasStruggles ? `- Known struggle topics: ${candidate.probedTopics.suggestedStruggles.join('; ')}` : `- Known mastered topics: ${candidate.probedTopics.suggestedStrengths.slice(0, 5).join('; ')}`}
${candidate.probedTopics.suggestedGaps.length > 0 ? `- Skipped topics: ${candidate.probedTopics.suggestedGaps.join('; ')}` : ''}

OPENING GOAL:
1. Greet ${candidate.name} briefly by name, acknowledging their background.
2. Directly launch into the first technical question focusing on Day ${targetDay}: "${dayInfo?.title}" (${dayInfo?.moduleTitle}).
${hasStruggles && candidate.missionByDay[targetDay]?.outcome === 'failed' ? `Note: Candidate took ${candidate.missionByDay[targetDay]?.attemptsCount} attempts on this topic. Probe their concrete understanding and what makes this difficult.` : `Note: Candidate passed this on the 1st try. Probe for advanced depth, design decisions, and trade-offs.`}
3. Tools in this topic: ${dayInfo?.tools?.join(', ') || 'N/A'}. Objectives: ${dayInfo?.objectives?.join('; ') || 'N/A'}.
4. Keep the question crisp, direct, and conversational. Do not output bullet lists or preamble. Ask ONE clear question.`;

    if (this.ai && process.env.GEMINI_API_KEY) {
      try {
        const response = await this.ai.models.generateContent({
          model: this.modelName,
          contents: [{ role: 'user', parts: [{ text: systemPrompt }] }],
        });
        const replyText = response.text?.trim();
        if (replyText) {
          return {
            reply: replyText,
            dayReferenced: targetDay,
            isComplete: false,
          };
        }
      } catch (err: any) {
        console.warn('Gemini API call failed, using high-fidelity signal fallback:', err.message);
      }
    }

    // Deterministic personalized fallback opening
    let fallbackReply = '';
    if (isHighPerformer) {
      fallbackReply = `Welcome, ${candidate.name}! Looking at your cohort signals, you demonstrated exceptional consistency with a ${candidate.performance.firstTrySuccessRate}% first-try completion rate. Let's kick off with Day ${targetDay} (${dayInfo?.title}). When designing vector embeddings with ${dayInfo?.tools?.slice(0, 2).join(' and ')}, how did you choose your embedding model and chunking strategy to balance retrieval precision against latency?`;
    } else {
      fallbackReply = `Welcome, ${candidate.name}! I'm glad to dive into your technical journey across the 31-day cohort. Looking at Day ${targetDay} (${dayInfo?.title}), you spent considerable effort navigating this mission (${candidate.missionByDay[targetDay]?.attemptsCount || 'multiple'} attempts). Walk me through the core technical challenges you encountered when implementing embeddings, and how you verified your vector representations were accurate.`;
    }

    return {
      reply: fallbackReply,
      dayReferenced: targetDay,
      isComplete: false,
    };
  }

  /**
   * Generates a context-aware follow-up question or transitions to the next curriculum topic.
   * Tracks total questions (minimum 8) and distinct day coverage (minimum 4 days).
   */
  public async generateFollowUpQuestion(session: InterviewSession, latestUserMessage: string): Promise<GeneratedQuestionResult> {
    const candidate = session.candidateShaped;
    const curriculum = loadCurriculum();
    const currentQuestionCount = session.questionCount;
    const coveredDaysCount = session.coveredDays.size;

    // Completion condition: minimum 8 questions AND at least 4 distinct days covered
    const shouldComplete = currentQuestionCount >= 8 && coveredDaysCount >= 4;

    if (shouldComplete) {
      return {
        reply: `Thank you, ${candidate.name}. That concludes all technical sections of our interview. I've compiled your detailed cohort evaluation and scorecard.`,
        isComplete: true,
      };
    }

    // Determine target day for this turn
    const targetDay = this.determineCurrentDay(session);
    const dayInfo = curriculum.getDay(targetDay);
    const mission = candidate.missionByDay[targetDay];

    // Format conversation history for prompt
    const historyFormatted = session.history
      .map(turn => `${turn.role === 'agent' ? 'Interviewer' : candidate.name}: ${turn.content}`)
      .join('\n\n');

    const isStruggleTopic = mission?.outcome === 'failed' || (mission?.attemptsCount && mission.attemptsCount >= 3);
    const isSkippedTopic = mission?.outcome === 'skipped';
    const isMasteryTopic = mission?.outcome === 'passed_first_try';

    const systemPrompt = `You are a Lead AI Engineer conducting a personalized technical interview.
You are interviewing ${candidate.name} (${candidate.jobRole}, ${candidate.yearsExperience} yrs exp).

INTERVIEW PROGRESS:
- Questions asked so far: ${currentQuestionCount} (Target: minimum 8)
- Distinct Curriculum Days covered: ${Array.from(session.coveredDays).join(', ')} (Covered: ${coveredDaysCount}, Target: at least 4 distinct days)
- Target Day for this question: Day ${targetDay} ("${dayInfo?.title}" - Module: ${dayInfo?.moduleTitle})
- Topic Tools: ${dayInfo?.tools?.join(', ') || 'General AI'}
- Topic Objectives: ${dayInfo?.objectives?.join('; ') || 'Core concepts'}

CANDIDATE SIGNALS ON THIS TOPIC:
${isStruggleTopic ? `- CANDIDATE STRUGGLED HERE: ${mission?.attemptsCount} attempts / failed. Probe their specific understanding, edge cases, and how they overcome failure.` : ''}
${isSkippedTopic ? `- CANDIDATE SKIPPED THIS TOPIC. Ask if they have foundational knowledge in this area and how they'd approach it.` : ''}
${isMasteryTopic ? `- CANDIDATE PASSED 1ST TRY. Ask challenging, high-depth architectural questions, performance bottlenecks, and system trade-offs.` : ''}

CONVERSATION HISTORY:
${historyFormatted}

CRITICAL RULES:
1. Every follow-up question MUST clearly and explicitly acknowledge and build on what ${candidate.name} just said in their latest response: "${latestUserMessage}".
2. Do NOT ask generic textbook questions. Critique, validate, or probe their specific claims or explanations.
3. Transition smoothly if pivoting to a new curriculum day (Day ${targetDay}: ${dayInfo?.title}).
4. Ask exactly ONE clear, focused question. Keep the tone professional, direct, and technically probing. No introductory fluff.`;

    if (this.ai && process.env.GEMINI_API_KEY) {
      try {
        const response = await this.ai.models.generateContent({
          model: this.modelName,
          contents: [{ role: 'user', parts: [{ text: systemPrompt }] }],
        });
        const replyText = response.text?.trim();
        if (replyText) {
          return {
            reply: replyText,
            dayReferenced: targetDay,
            isComplete: false,
          };
        }
      } catch (err: any) {
        console.warn('Gemini API call failed in follow-up, using context-aware fallback:', err.message);
      }
    }

    // Dynamic Context-Aware Fallback
    const fallbackReply = this.generateContextAwareFallback(
      candidate,
      dayInfo,
      mission,
      latestUserMessage,
      targetDay,
      currentQuestionCount
    );

    return {
      reply: fallbackReply,
      dayReferenced: targetDay,
      isComplete: false,
    };
  }

  private generateContextAwareFallback(
    candidate: any,
    dayInfo: any,
    mission: ShapedMission | undefined,
    userAnswer: string,
    targetDay: number,
    questionCount: number
  ): string {
    const isStruggle = mission?.outcome === 'failed' || (mission?.attemptsCount && mission.attemptsCount >= 3);
    const isSkipped = mission?.outcome === 'skipped';

    if (questionCount <= 3) {
      // Deep dive on current topic
      if (isStruggle) {
        return `You mentioned "${userAnswer.slice(0, 70)}...". Given your ${mission?.attemptsCount || 'multiple'} attempts on Day ${targetDay} (${dayInfo?.title}), how did you isolate bugs when testing this with ${dayInfo?.tools?.[0] || 'your pipeline'}, and what specific metric told you the implementation was finally sound?`;
      }
      return `Building on what you noted about "${userAnswer.slice(0, 70)}...", how would your approach scale when handling high-concurrency production traffic in ${dayInfo?.tools?.[0] || 'the system'}, and what failure modes would you monitor first?`;
    }

    // Transitioning to new curriculum days (e.g. Day 12 Prompting, Day 22 Agents, Day 28 Deployment)
    if (isSkipped) {
      return `Understood. Shifting focus to Day ${targetDay} (${dayInfo?.title}), which was skipped in your cohort submissions: how would you approach configuring ${dayInfo?.tools?.join(' or ')} to meet production ${dayInfo?.objectives?.[0] || 'requirements'}?`;
    }

    if (isStruggle) {
      return `That connects to your work on Day ${targetDay} (${dayInfo?.title}). In this mission (${mission?.attemptsCount} attempts), what architectural trade-off with ${dayInfo?.tools?.slice(0, 2).join(' / ')} gave you the most trouble, and how did you resolve it?`;
    }

    return `That makes sense regarding "${userAnswer.slice(0, 60)}...". Moving to Day ${targetDay} (${dayInfo?.title}): when building with ${dayInfo?.tools?.slice(0, 2).join(' and ')}, what specific design choices did you make to ensure reliability and low latency?`;
  }
}

export const getInterviewEngine = (): InterviewEngine => {
  return InterviewEngine.getInstance();
};
