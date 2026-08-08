import { loadCurriculum } from '../src/loaders/curriculumLoader.js';
import { loadCandidateById, CandidateLoader } from '../src/loaders/candidateLoader.js';

console.log('====================================================');
console.log('           PHASE 1: DATA SHAPING VERIFICATION        ');
console.log('====================================================\n');

// 1. Verify Curriculum Loading
const curriculum = loadCurriculum();
console.log(`[Curriculum Loaded]`);
console.log(`Cohort: ${curriculum.cohort}`);
console.log(`Total Modules: ${curriculum.modules.length}`);
console.log(`Total Days: ${curriculum.days.size}`);

const sampleDay = curriculum.getDay(10);
console.log(`\nSample Day 10 Lookup:`);
console.log(`- Title: ${sampleDay?.title}`);
console.log(`- Module: ${sampleDay?.moduleTitle} (Module #${sampleDay?.moduleNumber})`);
console.log(`- Tools: ${sampleDay?.tools.join(', ')}`);
console.log(`- Objectives: ${sampleDay?.objectives.join('; ')}`);

// 2. Verify Candidate Loading & Shaping
const loader = CandidateLoader.getInstance();
const allRaw = loader.loadAllRawCandidates();
console.log(`\n[Candidates Loaded] Total Candidates: ${allRaw.length}`);

// Print shaped example for CAND-016 (Isabella Rossi)
const cand16 = loadCandidateById('CAND-016');
console.log('\n----------------------------------------------------');
console.log('PRINTED EXAMPLE: SHAPED CANDIDATE DATA FOR CAND-016');
console.log('----------------------------------------------------');
console.log(JSON.stringify(cand16, null, 2));

console.log('\n====================================================');
console.log('SUMMARY COMPARISON: CAND-016 vs CAND-003');
console.log('====================================================');
const cand3 = loadCandidateById('CAND-003');
console.log(`\nCandidate: ${cand16?.name} (${cand16?.id}) - ${cand16?.jobRole}`);
console.log(`- Signals: Commit Days: ${cand16?.signals.commitDays}/31, First Try: ${cand16?.signals.missionsFirstTry}/${cand16?.signals.missionsCompleted}`);
console.log(`- First-Try Pass Rate: ${cand16?.performance.firstTrySuccessRate}%`);
console.log(`- Struggled Topics: ${cand16?.performance.struggleMissions.length}`);
cand16?.probedTopics.suggestedStruggles.forEach(s => console.log(`  * ${s}`));
console.log(`- Skipped Topics: ${cand16?.performance.skippedMissions.length}`);
cand16?.probedTopics.suggestedGaps.forEach(g => console.log(`  * ${g}`));

console.log(`\nCandidate: ${cand3?.name} (${cand3?.id}) - ${cand3?.jobRole}`);
console.log(`- Signals: Commit Days: ${cand3?.signals.commitDays}/31, First Try: ${cand3?.signals.missionsFirstTry}/${cand3?.signals.missionsCompleted}`);
console.log(`- First-Try Pass Rate: ${cand3?.performance.firstTrySuccessRate}%`);
console.log(`- Struggled Topics: ${cand3?.performance.struggleMissions.length}`);
console.log(`- Mastered Topics (1st Try): ${cand3?.performance.masteryMissions.length}`);
cand3?.probedTopics.suggestedStrengths.slice(0, 5).forEach(s => console.log(`  * ${s}`));
