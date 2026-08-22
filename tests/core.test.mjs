import test from "node:test";
import assert from "node:assert/strict";
import { buildAnalysisSignal, calculateInterventionEffect, calculateReviewPriority } from "../src/core.mjs";

test("wrong answer becomes an evidence-bound confusion signal and 24-hour retry", () => {
  const answeredAt = "2026-08-22T00:00:00.000Z";
  const signal = buildAnalysisSignal({
    question: { id: "sample-q1", subjectCode: "A", domain: "rules", concept: "scope", answer: "B", numericType: "none" },
    selectedChoice: "A",
    answeredAt,
    choiceMap: { A: { diagnosis: "scope confusion", misconception: "condition scope confusion" } },
    evidence: { material: "Instructor note", page: 3 },
  });
  assert.equal(signal.correct, false);
  assert.equal(signal.confusionSource, "curated-choice-map");
  assert.equal(signal.reviewDueAt, "2026-08-23T00:00:00.000Z");
  assert.match(signal.learnerAction, /Instructor note/);
});

test("priority is explainable and capped at 100", () => {
  const priority = calculateReviewPriority({ correct: false, relatedWrongCount: 4, mixedAcrossAttempts: true, numeric: true });
  assert.equal(priority.score, 100);
  assert.equal(priority.level, "urgent");
  assert.equal(priority.components.length, 5);
});

test("intervention effect waits for enough post answers", () => {
  const baseline = { answerCount: 20, correctCount: 8, affectedLearners: 10, targetChoiceCount: 9, totalLearners: 20 };
  const immature = calculateInterventionEffect(baseline, { answerCount: 4, correctCount: 3, affectedLearners: 2, targetChoiceCount: 1, totalLearners: 4 });
  assert.equal(immature.measurementReady, false);
  const measured = calculateInterventionEffect(baseline, { answerCount: 10, correctCount: 7, affectedLearners: 3, targetChoiceCount: 2, totalLearners: 10 });
  assert.equal(measured.measurementReady, true);
  assert.equal(measured.accuracyChange, 30);
});

