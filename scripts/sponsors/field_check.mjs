import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const projectRoot = fileURLToPath(new URL("../../", import.meta.url));
const liveMode = process.argv.includes("--live");

const integrations = [
  {
    id: "bright-data",
    name: "Bright Data",
    adapter: "scripts/sponsors/bright_data_refresh.mjs",
    requiredSecrets: ["BRIGHT_DATA_API_KEY", "BRIGHT_DATA_ZONE"],
    command: ["node", "scripts/sponsors/bright_data_refresh.mjs"],
    purpose: "보험개발원 공개 게시판의 갱신 응답과 원문 해시 확인",
  },
  {
    id: "daytona",
    name: "Daytona",
    adapter: "scripts/sponsors/daytona_validate.mjs",
    requiredSecrets: ["DAYTONA_API_KEY"],
    command: ["node", "scripts/sponsors/daytona_validate.mjs"],
    purpose: "대규모 문항 데이터의 ID·답안·보기 구조를 격리 샌드박스에서 검증",
  },
  {
    id: "nosana",
    name: "Nosana",
    adapter: "scripts/sponsors/nosana_batch_job.mjs",
    requiredSecrets: ["NOSANA_API_KEY", "NOSANA_MARKET"],
    command: ["node", "scripts/sponsors/nosana_batch_job.mjs"],
    purpose: "문항 일괄 분류용 GPU 작업 정의와 제출 결과 확인",
  },
  {
    id: "qwen-cloud",
    name: "Qwen Cloud",
    adapter: "scripts/sponsors/qwen_smoke.mjs",
    requiredSecrets: ["DASHSCOPE_API_KEY"],
    command: ["node", "scripts/sponsors/qwen_smoke.mjs"],
    purpose: "근거 제한 진단 모델의 최소 JSON 응답 확인",
  },
];

function run(command, args, extraEnv = {}) {
  return new Promise((resolve) => {
    const startedAt = Date.now();
    const child = spawn(command, args, {
      cwd: projectRoot,
      env: { ...process.env, ...extraEnv },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("close", (code) => resolve({
      ok: code === 0,
      code,
      stdout: stdout.trim(),
      stderr: stderr.trim(),
      durationMs: Date.now() - startedAt,
    }));
  });
}

function parseJsonOutput(stdout) {
  const start = stdout.indexOf("{");
  const end = stdout.lastIndexOf("}");
  if (start < 0 || end < start) return null;
  try {
    return JSON.parse(stdout.slice(start, end + 1));
  } catch {
    return null;
  }
}

function liveProof(id, payload) {
  if (!payload) return "실제 호출 응답과 종료코드 확인";
  if (id === "bright-data") return `응답 ${payload.bytes ?? 0} bytes · SHA-256 ${String(payload.sha256 ?? "").slice(0, 12)}`;
  if (id === "daytona") return `${payload.questionCount ?? 0}문항 · 고유 ID ${payload.uniqueIds ?? 0}개 · 샌드박스 ${payload.sandboxId ?? "확인"}`;
  if (id === "nosana") return `GPU 작업 제출 · ${payload.ipfsHash ? `IPFS ${String(payload.ipfsHash).slice(0, 14)}` : "작업 ID 확인"}`;
  return `${payload.model ?? "Qwen"} · 응답 ID ${payload.responseId ?? "확인"}`;
}

const results = [];
for (const integration of integrations) {
  const adapterSource = await readFile(path.join(projectRoot, integration.adapter), "utf8");
  const syntax = await run("node", ["--check", integration.adapter]);
  const configured = integration.requiredSecrets.every((name) => Boolean(process.env[name]));
  const base = {
    id: integration.id,
    name: integration.name,
    purpose: integration.purpose,
    adapter: integration.adapter,
    adapterSha256: createHash("sha256").update(adapterSource).digest("hex"),
    adapterReady: syntax.ok,
    configured,
    requiredSecrets: integration.requiredSecrets,
    durationMs: syntax.durationMs,
  };

  if (!syntax.ok) {
    results.push({ ...base, status: "failed", proof: "어댑터 구문 점검 실패", error: syntax.stderr.slice(0, 240) });
    continue;
  }

  if (!liveMode) {
    if (integration.id === "nosana") {
      const dryRun = await run("node", integration.command.slice(1), { NOSANA_EXECUTE: "0" });
      results.push({
        ...base,
        durationMs: syntax.durationMs + dryRun.durationMs,
        status: dryRun.ok ? "adapter-ready" : "failed",
        proof: dryRun.ok ? "GPU 작업 정의 유효성 점검 완료" : "GPU 작업 정의 점검 실패",
        error: dryRun.ok ? null : dryRun.stderr.slice(0, 240),
      });
      continue;
    }
    results.push({ ...base, status: "adapter-ready", proof: "실행 어댑터 구문 점검 완료", error: null });
    continue;
  }

  if (!configured) {
    results.push({ ...base, status: "awaiting-key", proof: "현장 키 입력 후 실제 호출 대기", error: null });
    continue;
  }

  const extraEnv = integration.id === "nosana" ? { NOSANA_EXECUTE: "1" } : {};
  const execution = await run(integration.command[0], integration.command.slice(1), extraEnv);
  const payload = parseJsonOutput(execution.stdout);
  results.push({
    ...base,
    durationMs: execution.durationMs,
    status: execution.ok ? "verified" : "failed",
    proof: execution.ok ? liveProof(integration.id, payload) : "실제 호출 실패",
    evidenceSha256: execution.ok ? createHash("sha256").update(execution.stdout).digest("hex") : null,
    error: execution.ok ? null : execution.stderr.slice(0, 240),
  });
}

const report = {
  schemaVersion: 1,
  project: "Exam Coach",
  generatedAt: new Date().toISOString(),
  mode: liveMode ? "live" : "dry-run",
  adapterReadyCount: results.filter((item) => item.adapterReady).length,
  configuredCount: results.filter((item) => item.configured).length,
  verifiedCount: results.filter((item) => item.status === "verified").length,
  failedCount: results.filter((item) => item.status === "failed").length,
  integrations: results,
};

const outputDirectory = path.join(projectRoot, "output", "sponsors");
await mkdir(outputDirectory, { recursive: true });
const serialized = `${JSON.stringify(report, null, 2)}\n`;
await Promise.all([
  writeFile(path.join(outputDirectory, "field-check.json"), serialized),
]);
console.log(serialized.trim());
