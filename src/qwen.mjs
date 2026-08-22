function stripCodeFence(value) {
  return value.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
}

export async function refineDiagnosisWithQwen(input, localDiagnosis) {
  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey) return { ...localDiagnosis, provider: "local-evidence-engine" };

  const baseUrl = (process.env.QWEN_BASE_URL ?? "https://dashscope-intl.aliyuncs.com/compatible-mode/v1").replace(/\/$/, "");
  const model = process.env.QWEN_MODEL ?? "qwen-plus";
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You are an exam-error coach. Use only the supplied official answer, curated distractor map, and instructor-owned evidence. Return JSON only. Never invent legal or conceptual grounds.",
        },
        {
          role: "user",
          content: JSON.stringify({
            requiredKeys: ["diagnosis", "whyWrong", "misconception", "nextAction"],
            question: input.question,
            selectedChoice: input.selectedChoice,
            correctChoice: input.correctChoice,
            curatedChoiceAnalysis: input.curatedChoiceAnalysis,
            evidence: input.evidence,
            deterministicNextAction: localDiagnosis.nextAction,
          }),
        },
      ],
    }),
  });

  if (!response.ok) throw new Error(`Qwen request failed: ${response.status}`);
  const payload = await response.json();
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("Qwen returned an empty response");
  const refined = JSON.parse(stripCodeFence(content));
  for (const key of ["diagnosis", "whyWrong", "misconception", "nextAction"]) {
    if (!refined[key]) throw new Error(`Qwen response is missing ${key}`);
  }
  return { ...localDiagnosis, ...refined, provider: "Qwen Cloud", model, responseId: payload.id ?? null };
}

