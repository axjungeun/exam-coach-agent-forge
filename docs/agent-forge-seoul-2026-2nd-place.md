# v0.1 - Agent Forge Seoul Edition

## Award record

| Field | Value |
|---|---|
| Event | Agent Forge AI Hackathon Seoul 2026 |
| Result | 2nd Place |
| Selection | Audience vote |
| Completed projects | 18 |
| Date | 2026-08-22 |
| Project | AI Exam Coach |
| Build type | Solo build |
| Git tag | `agent-forge-seoul-2026-2nd-place` |
| Archive branch | `archive/agent-forge-seoul-2026-2nd-place` |
| Reviewer Worker version | `adf4a871-3762-491b-8cd1-0e520c1daffa` |
| Reviewer URL | `https://exam-coach-demo.geilesgruen.workers.dev` |
| Organizer result | [AI Builders result post](https://x.com/theaibuilders/status/2091084859330691214) |

The organizing team reported that 18 projects were shipped in one day and named Exam Coach second in the audience-voted top three. The number 18 is a completed-project count, not a participant headcount. This result applies only to the named Seoul event.

## Preservation boundary

This public tag preserves the source-safe submission bundle, architecture notes, sponsor adapters, tests, and secret-free live evidence available to judges. Copyrighted exam text, paid instructor material, learner records, credentials, patent documents, and the private full-application repository are intentionally excluded.

The full submitted UI, configuration, prompt-governance structure, deck, and demo video are preserved separately in a private full-app snapshot under the same tag name. Development does not continue on either archive branch.

The organizer result post is linked above. Organizer-provided photos and the personal participation certificate are preserved outside this public code repository; this release does not publish personal evidence files or use an unofficial image as an official award image.

## Core capabilities represented in v0.1

- Verify an answer against a confirmed answer key.
- Convert the selected distractor into a concept-confusion signal.
- Retrieve the matching location from instructor-owned evidence.
- Use Qwen within the confirmed-answer and retrieved-evidence boundary.
- Produce a learner review action and an instructor reinforcement action from the same signal.
- Persist a retry and intervention-comparison path in the deployed application.
- Keep the public learner surface separate from the access-controlled reviewer surface.

## Sponsor and platform technology

| Technology | Role | Submission-time evidence |
|---|---|---|
| Qwen Cloud `qwen-plus` | Evidence-bounded distractor diagnosis | Live response received and validated |
| Bright Data | Public-source refresh and change-detection adapter | Authenticated Scraping Browser endpoint returned HTTP 200 |
| Daytona | Isolated question-data validation | Linux sandbox validated 1,200 questions, 1,200 unique IDs, 3 subjects, rounds 40-49, and 0 missing records |
| Nosana | GPU batch-classification execution path | Mainnet NVIDIA 3060 job registered with transaction, job, and run identifiers |
| Cloudflare Workers + D1 | Application runtime and persisted learning signals | Production deployment completed |

Machine-readable evidence is in `output/sponsors/`; secrets are not stored.

## Technical structure

```text
learner answer
  -> confirmed-answer check
  -> selected-distractor confusion code
  -> instructor evidence retrieval
  -> bounded Qwen diagnosis
  -> learner review action
  -> instructor reinforcement signal
  -> later retry/intervention comparison path
```

The repository includes a data-free reference implementation in `src/core.mjs`, a Qwen adapter in `src/qwen.mjs`, sponsor adapters under `scripts/sponsors/`, synthetic structure-only fixtures, and automated tests.

## Run the public frozen bundle

```bash
git clone https://github.com/axjungeun/exam-coach-agent-forge.git
cd exam-coach-agent-forge
git checkout agent-forge-seoul-2026-2nd-place
npm install
npm test
```

Optional live checks require separately supplied credentials and can incur external usage or cost:

```bash
DASHSCOPE_API_KEY=... npm run sponsor:qwen
BRIGHT_DATA_API_KEY=... BRIGHT_DATA_ZONE=... npm run sponsor:bright
DAYTONA_API_KEY=... npm run sponsor:daytona
NOSANA_EXECUTE=1 NOSANA_API_KEY=... NOSANA_MARKET=... npm run sponsor:nosana
```

## Known limitations at v0.1

- This public repository is a sanitized submission bundle, not the complete deployed UI source.
- Rights clearance is still required before wider public or commercial use of official exam material.
- Exact platform course IDs and lecture video timestamps were not connected.
- Choice-level precision mapping was manually reviewed for seven representative questions, not the entire 1,200-question corpus.
- The instructor cohort used synthetic data and does not prove real learner outcomes.
- The post-intervention calculation path existed, but real post-intervention learner outcome samples were zero at submission.
- Anki integration and constructed-response grading were outside the award-version scope.
- Live sponsor evidence proves the recorded submission-time calls, not permanent availability or future performance.

## Version line

- `v0.1` - Agent Forge Seoul Edition, frozen award version
- `v0.2` - stronger RAG and evidence retrieval
- `v0.3` - learner memory and weak-concept tracking
- `v0.4` - personalized learning agent
- `v1.0` - objective and constructed-response Exam Coach

Roadmap labels describe future work and are not claims of implemented features.
