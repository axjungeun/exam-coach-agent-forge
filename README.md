# AI Exam Coach

**Agent Forge AI Hackathon Seoul 2026 · Solo build by Jungeun Lee**

AI Exam Coach turns an answer into an evidence-bound learning action. It maps a selected distractor to a concept-confusion code, connects that code to the exact instructor-owned lesson or textbook location, schedules a retry, and aggregates the same signal into an instructor reinforcement priority.

## Live Demo

- Reviewer app: <https://exam-coach-demo.geilesgruen.workers.dev>
- Access credentials are supplied privately to judges.
- Runtime: Cloudflare Workers + D1
- Live model: Qwen Cloud `qwen-plus`

## Why It Is an AI Application

The model is one bounded step inside an executable workflow:

1. Verify the learner answer against the confirmed answer key.
2. Convert the selected distractor into a confusion signal.
3. Retrieve the matching location from instructor-owned evidence.
4. Ask Qwen to refine the diagnosis without leaving that evidence boundary.
5. Create a learner review action and an instructor reinforcement action.
6. Compare later retry results with the pre-intervention window.

See [the architecture note](docs/architecture.md) and the data-free reference implementation in [`src/core.mjs`](src/core.mjs).

## Sponsor Integrations

```bash
npm install
npm run check

# Live Qwen check
DASHSCOPE_API_KEY=... npm run sponsor:qwen

# Live sponsor adapters
BRIGHT_DATA_API_KEY=... BRIGHT_DATA_ZONE=... npm run sponsor:bright
DAYTONA_API_KEY=... npm run sponsor:daytona
npm run sponsor:nosana                       # safe dry-run
NOSANA_EXECUTE=1 NOSANA_API_KEY=... NOSANA_MARKET=... npm run sponsor:nosana
```

`npm run sponsor:check` reports adapter readiness without treating missing credentials as a successful live run.

## Repository Boundary

This public submission intentionally excludes copyrighted exam text, paid course material, learner records, credentials, and patent documents. The included question bank is a synthetic structure-only fixture. The deployed reviewer demo uses a limited, access-controlled dataset while rights clearance is being handled separately.

## Verified at Submission

- Qwen Cloud `qwen-plus`: live response received and validated.
- Bright Data: authenticated Scraping Browser endpoint returned HTTP 200.
- Daytona: isolated Linux sandbox validated 1,200 questions, 1,200 unique IDs, 3 subjects, rounds 40-49, and 0 missing records.
- Nosana: mainnet NVIDIA 3060 job registered and returned transaction, job, and run identifiers.
- Cloudflare Worker: production deployment completed.
- Core workflow functions: automated tests included.

Machine-readable, secret-free evidence is stored in [`output/sponsors`](output/sponsors), with the consolidated state in [`app/data/sponsor-readiness.json`](app/data/sponsor-readiness.json). All four sponsor integrations were live-verified at submission; credentials are never stored in this repository.

## License

MIT for the source code in this repository. No rights are granted to external exam, textbook, or lecture content.
