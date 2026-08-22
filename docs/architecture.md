# Architecture

```text
Official answer + instructor-owned evidence + learner answer
                         |
                         v
              deterministic signal engine
        (choice -> confusion -> evidence -> action)
                         |
               +---------+----------+
               |                    |
               v                    v
      learner review queue    instructor insight
      evidence + 24h retry    affected learners + action
               |                    |
               +---------+----------+
                         v
             post-intervention measurement
```

The production demo is deployed as two Cloudflare Workers. Static UI assets are served at the edge; authenticated attempts, answer-level signals, review tasks, and instructor interventions are stored in Cloudflare D1. Qwen Cloud refines a deterministic diagnosis only inside the supplied answer, distractor-map, and instructor-evidence boundary. If the model call fails, the local evidence engine remains the fallback.

## Core Records

- `exam_attempts`: one graded subject/round attempt
- `exam_answers`: answer-level outcome and concept metadata
- `analysis_signals`: selected distractor, confusion code, evidence, learner action, instructor action
- `review_tasks`: scheduled retry derived from an analysis signal
- `lecture_interventions`: instructor action plus baseline measurement window

## Sponsor Roles

| Sponsor | Code role | Evidence status at submission |
|---|---|---|
| Qwen Cloud | Evidence-bounded diagnosis refinement | Live call verified with `qwen-plus` |
| Bright Data | Refresh and hash a public-source response | Authenticated Scraping Browser endpoint returned HTTP 200 |
| Daytona | Validate question-bank structure in an isolated sandbox | Live Linux sandbox validated 1,200 questions with 0 missing records |
| Nosana | Define and submit a GPU batch-classification job | Mainnet NVIDIA 3060 job returned transaction, job, and run identifiers |

GitHub/account connection alone is not reported as a successful API run.
Secret-free response evidence and SHA-256 hashes are stored in [`../output/sponsors`](../output/sponsors).
