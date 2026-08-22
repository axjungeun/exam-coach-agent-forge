const actionLabels = {
  explanation: "Compare the correct and distractor conditions",
  drill: "Add a drill targeting the same error stage",
  recall: "Schedule a recall quiz before the next lesson",
};

function percent(part, whole) {
  return whole > 0 ? Math.round((part / whole) * 1000) / 10 : 0;
}

export function buildAnalysisSignal({ question, selectedChoice, answeredAt, choiceMap = {}, evidence = null }) {
  const correct = selectedChoice === question.answer;
  const curated = correct ? null : choiceMap[selectedChoice] ?? null;
  const actionType = question.numericType && question.numericType !== "none"
    ? "drill"
    : curated && /(confus|distinguish|condition|scope|subject)/i.test(`${curated.diagnosis} ${curated.misconception}`)
      ? "explanation"
      : "recall";

  return {
    signalCode: `choice:${question.id}:${selectedChoice}`,
    questionId: question.id,
    subjectCode: question.subjectCode,
    domain: question.domain,
    concept: question.concept,
    selectedChoice,
    correct,
    confusionCode: correct ? null : `confusion:${question.id}:${selectedChoice}`,
    confusionLabel: correct ? null : curated?.diagnosis ?? `${question.concept}: distractor ${selectedChoice}`,
    confusionSource: correct ? "correct-answer" : curated ? "curated-choice-map" : "question-metadata-fallback",
    evidence,
    learnerAction: correct
      ? "Confirm retention with a variant question"
      : evidence
        ? `Recall ${evidence.material} p.${evidence.page}, then retry the scheduled question`
        : `Connect evidence for ${question.concept}, then retry the scheduled question`,
    instructorActionType: actionType,
    instructorAction: actionLabels[actionType],
    reviewDueAt: correct ? null : new Date(Date.parse(answeredAt) + 24 * 60 * 60 * 1000).toISOString(),
  };
}

export function calculateReviewPriority({ correct, relatedWrongCount = 0, mixedAcrossAttempts = false, numeric = false, complex = false }) {
  const components = [
    { label: "current answer", score: correct ? 8 : 36 },
    { label: "repeated confusion", score: Math.min(24, relatedWrongCount * 12) },
    { label: "attempt volatility", score: mixedAcrossAttempts ? 18 : 0 },
    { label: "question complexity", score: numeric ? 16 : complex ? 10 : 4 },
    { label: "retry urgency", score: correct ? 3 : 10 },
  ];
  const score = Math.min(100, components.reduce((sum, component) => sum + component.score, 0));
  const level = score >= 85 ? "urgent" : score >= 65 ? "high" : score >= 40 ? "medium" : "low";
  return { score, level, components };
}

export function calculateInterventionEffect(baseline, post, minimumPostAnswers = 5) {
  const baselineAccuracy = percent(baseline.correctCount, baseline.answerCount);
  const baselineTargetChoiceRate = percent(baseline.targetChoiceCount, baseline.answerCount);
  if (post.answerCount < minimumPostAnswers) {
    return { baselineAccuracy, baselineTargetChoiceRate, measurementReady: false };
  }

  const postAccuracy = percent(post.correctCount, post.answerCount);
  const postTargetChoiceRate = percent(post.targetChoiceCount, post.answerCount);
  const residualConfusionRate = baselineTargetChoiceRate > 0
    ? Math.min(100, Math.round((postTargetChoiceRate / baselineTargetChoiceRate) * 1000) / 10)
    : postTargetChoiceRate > 0 ? 100 : 0;
  const postWrongRate = 100 - postAccuracy;
  const postAffectedRate = percent(post.affectedLearners, post.totalLearners);

  return {
    baselineAccuracy,
    postAccuracy,
    accuracyChange: Math.round((postAccuracy - baselineAccuracy) * 10) / 10,
    baselineTargetChoiceRate,
    postTargetChoiceRate,
    targetChoiceRateChange: Math.round((postTargetChoiceRate - baselineTargetChoiceRate) * 10) / 10,
    residualConfusionRate,
    updatedDemandScore: Math.min(100, Math.round(postWrongRate * 0.6 + postAffectedRate * 0.2 + residualConfusionRate * 0.2)),
    measurementReady: true,
  };
}

