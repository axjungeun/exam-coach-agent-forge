import {
  createNosanaClient,
  generateIdempotencyKey,
  NosanaNetwork,
  validateJobDefinition,
} from "@nosana/kit";

const jobDefinition = {
  version: "0.1",
  type: "container",
  ops: [
    {
      id: "exam-coach-batch-classifier",
      type: "container/run",
      args: {
        image: "vllm/vllm-openai:latest",
        cmd: [
          "--model",
          process.env.NOSANA_MODEL ?? "Qwen/Qwen2.5-3B-Instruct",
          "--host",
          "0.0.0.0",
          "--port",
          "8000",
          "--max-model-len",
          "8192",
        ],
        expose: 8000,
        gpu: true,
      },
    },
  ],
  meta: {
    trigger: "api",
    system_resources: { required_vram: 8 },
  },
};

validateJobDefinition(jobDefinition);

if (process.env.NOSANA_EXECUTE !== "1") {
  console.log(JSON.stringify({
    provider: "Nosana",
    mode: "dry-run",
    valid: true,
    purpose: "대규모 문항의 대영역·세부키워드·계산유형 일괄 분류용 GPU 추론 엔드포인트",
    jobDefinition,
  }, null, 2));
  process.exit(0);
}

if (!process.env.NOSANA_API_KEY || !process.env.NOSANA_MARKET) {
  throw new Error("실행에는 NOSANA_API_KEY와 NOSANA_MARKET이 필요합니다.");
}

const client = createNosanaClient(NosanaNetwork.MAINNET, {
  api: { apiKey: process.env.NOSANA_API_KEY },
});
const ipfsHash = await client.ipfs.pin(jobDefinition);
const job = await client.api.jobs.list(
  {
    ipfsHash,
    market: process.env.NOSANA_MARKET,
    timeout: 1800,
  },
  { idempotencyKey: generateIdempotencyKey() },
);
console.log(JSON.stringify({ provider: "Nosana", mode: "live", ipfsHash, job }, null, 2));
