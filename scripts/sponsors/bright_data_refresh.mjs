import { createHash } from "node:crypto";

const apiKey = process.env.BRIGHT_DATA_API_KEY;
const zone = process.env.BRIGHT_DATA_ZONE;
const sourceUrl = process.env.OFFICIAL_SOURCE_URL ?? "https://certi.kidi.or.kr:10443/exam/library/past-list";

if (!apiKey || !zone) {
  throw new Error("BRIGHT_DATA_API_KEY와 BRIGHT_DATA_ZONE이 필요합니다.");
}

const response = await fetch("https://api.brightdata.com/request", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    zone,
    url: sourceUrl,
    format: "raw",
    data_format: "markdown",
    country: "kr",
  }),
});

if (!response.ok) {
  throw new Error(`Bright Data request failed: ${response.status} ${await response.text()}`);
}

const payload = await response.text();
console.log(JSON.stringify({
  provider: "Bright Data Web Unlocker",
  sourceUrl,
  fetchedAt: new Date().toISOString(),
  bytes: Buffer.byteLength(payload),
  sha256: createHash("sha256").update(payload).digest("hex"),
  containsPastExamMarker: /기출|past|시험/.test(payload),
}, null, 2));

