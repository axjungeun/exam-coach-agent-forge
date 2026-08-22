import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Daytona } from "@daytona/sdk";

const sourcePath = resolve(process.env.EXAM_DATA_PATH ?? "samples/synthetic-question-bank.json");
const source = JSON.parse(await readFile(sourcePath, "utf8"));
const compactRows = source.questions.map((question) => ({
  id: question.id,
  round: question.round,
  subjectCode: question.subjectCode,
  questionNo: question.questionNo,
  answer: question.answer,
  choiceCount: Object.keys(question.choices ?? {}).length,
}));

if (!process.env.DAYTONA_API_KEY) {
  throw new Error("DAYTONA_API_KEY가 필요합니다.");
}

const encoded = Buffer.from(JSON.stringify(compactRows)).toString("base64");
const validatorCode = `
import base64, json
rows = json.loads(base64.b64decode(${JSON.stringify(encoded)}).decode("utf-8"))
ids = [row["id"] for row in rows]
subjects = sorted(set(row["subjectCode"] for row in rows))
rounds = sorted(set(row["round"] for row in rows))
result = {
  "questionCount": len(rows),
  "uniqueIds": len(set(ids)),
  "subjects": subjects,
  "rounds": rounds,
  "invalidChoiceCounts": sum(1 for row in rows if row["choiceCount"] != 4),
  "missingAnswers": sum(1 for row in rows if not row["answer"]),
  "valid": len(rows) > 0 and len(set(ids)) == len(rows) and all(row["choiceCount"] == 4 for row in rows) and all(row["answer"] for row in rows)
}
print(json.dumps(result, ensure_ascii=False))
`;

const daytona = new Daytona();
const sandbox = await daytona.create({
  language: "python",
  ephemeral: true,
  autoDeleteInterval: 5,
  labels: { project: "exam-coach", task: "official-data-validation" },
});

try {
  const result = await sandbox.process.codeRun(validatorCode, undefined, 120);
  const parsed = JSON.parse(result.result.trim());
  console.log(JSON.stringify({
    provider: "Daytona Sandbox",
    sandboxId: sandbox.id,
    sourcePath,
    ...parsed,
  }, null, 2));
  if (!parsed.valid) process.exitCode = 1;
} finally {
  await daytona.delete(sandbox, 60, true);
}
