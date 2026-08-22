const apiKey = process.env.DASHSCOPE_API_KEY;

if (!apiKey) {
  throw new Error("DASHSCOPE_API_KEY가 필요합니다.");
}

const baseUrl = (process.env.QWEN_BASE_URL ?? "https://dashscope-intl.aliyuncs.com/compatible-mode/v1").replace(/\/$/, "");
const model = process.env.QWEN_MODEL ?? "qwen-plus";
const startedAt = Date.now();
const response = await fetch(`${baseUrl}/chat/completions`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model,
    temperature: 0,
    max_tokens: 40,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: "JSON만 출력한다.",
      },
      {
        role: "user",
        content: 'Exam Coach 연결 점검이다. {"status":"ready","service":"Exam Coach"}를 출력하라.',
      },
    ],
  }),
});

if (!response.ok) {
  throw new Error(`Qwen smoke test failed: ${response.status} ${await response.text()}`);
}

const payload = await response.json();
const content = payload.choices?.[0]?.message?.content ?? "";
if (!/ready/i.test(content)) {
  throw new Error("Qwen smoke test returned an unexpected response.");
}

console.log(JSON.stringify({
  provider: "Qwen Cloud",
  mode: "live",
  model,
  responseId: payload.id ?? null,
  responseVerified: true,
  durationMs: Date.now() - startedAt,
}, null, 2));
