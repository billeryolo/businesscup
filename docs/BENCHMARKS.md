# Benchmarks for the 1-minute checks

Where every "kids in the same grade" number comes from. Seasons follow the school year, as in
`src/lib/reading/norms.ts`: fall = Aug–Nov (beginning of year), winter = Dec–Feb (middle),
spring = Mar–Jul (end).

Each norm in code carries `source: "published" | "estimate"`, so the UI can say "estimate" in
small print and the assistant never calls an estimate "the national average".

## Which check each grade gets

| Grade | Reading | Letters | Math |
|---|---|---|---|
| Pre-K | — | Letter naming *(estimate)* | Number naming *(estimate)* |
| K | Word list, not a story *(DIBELS 8 WRF)* | Letter naming *(DIBELS 8 LNF)* | Number naming *(estimate)* |
| 1 | Story *(Hasbrouck & Tindal ORF, already in code)* | Letter naming *(DIBELS 8 LNF)*, optional | Sums *(Rocket Math)* |
| 2–4 | Story *(Hasbrouck & Tindal ORF, already in code)* | — | Sums *(Rocket Math)* |

## Verdicts

| Published band | Verdict on the result screen |
|---|---|
| DIBELS Blue / Green (core support) | On track |
| DIBELS Yellow (strategic support) | Needs practice |
| DIBELS Red (intensive support) | Talk to the teacher |
| ORF at or above 25th percentile | On track (existing logic in `assess.ts`) |

For Rocket Math and the estimates (there are no bands): at or above the goal = On track;
at least half the goal = Needs practice; below half = Talk to the teacher *(the half cut is our estimate)*.

---

## Letters: DIBELS 8 Letter Naming Fluency (published)

Correct letter names in 1 minute. Minimum score for each band.

| | Fall | Winter | Spring |
|---|---|---|---|
| **K** Green (on track) | 25 | 37 | 42 |
| **K** Yellow | 16 | 31 | 35 |
| **K** Red | 0 | 0 | 0 |
| **Grade 1** Green | 42 | 57 | 59 |
| **Grade 1** Yellow | 32 | 51 | 53 |
| **Grade 1** Red | 0 | 0 | 0 |

LNF has no Blue band. Source: [DIBELS 8th Edition Benchmark Goals](https://dibels.uoregon.edu/sites/default/files/2024-01/dibels8_benchmark_goals.pdf),
University of Oregon, goals updated July 2020.

## K reading: DIBELS 8 Word Reading Fluency (published)

Words read correctly from a list in 1 minute. Minimum score for each band.

| | Fall | Winter | Spring |
|---|---|---|---|
| **K** Blue | — | 10 | 18 |
| **K** Green | 1 | 4 | 10 |
| **K** Yellow | 0 | 1 | 6 |
| **K** Red | — | 0 | 0 |

In the fall almost every kindergartner scores 0–1, so in the fall we show the number and growth but
no verdict. Same source as above. The PDF's text comes out jumbled, so check these numbers against
the printed table before the demo.

## Reading, grades 1–4: Hasbrouck & Tindal ORF (published, already in code)

Unchanged. See `src/lib/reading/norms.ts`. (DIBELS 8 also has grade 1–4 ORF goals; we keep H&T
because it gives percentiles for the bar.)

## Math, grades 1–4: Rocket Math fact fluency (published, vendor)

Written problems correct per minute. Our number pad is the nearest match to a written test. One goal
per operation, with no percentiles.

| Grade | Fall | Winter | Spring | Operations in the check |
|---|---|---|---|---|
| 1 | + 12 | + 25 | + 25, − 12 | + only until spring, then + and − |
| 2 | + 25 | + 30, − 12 | + 30, − 25 | + in fall, then + and − |
| 3 | + 30, − 30 | + 30, − 30, × 30 | same as winter | + − in fall, then + − × |
| 4 | + − × 35 | + − 35, ÷ 20 | + − 35, ÷ 35 | + − × in fall, then all four |

The goal for a mixed check is the average of its operations' goals *(our choice)*. Grade 4 in the
winter = (35 + 35 + 35 + 20) / 4 ≈ 31.

Source: [Rocket Math Fact Fluency Benchmarks](https://www.rocketmath.com/wp-content/uploads/2024/09/Math_Fact_Fluency_Benchmarks_2024.pdf),
2024. Rocket Math says the goals come from classroom data across many schools; they aren't
peer-reviewed norms. The grade 4 winter and spring rows print "Subtraction 35" twice where
multiplication is expected; we read it as × 35.

---

## Estimates (no published per-minute norms found)

### Pre-K letter naming

Rough goals, set so a Pre-K child reaches the bottom of the kindergarten Yellow band (16) by spring.

| | Fall | Winter | Spring |
|---|---|---|---|
| Goal (On track) | 5 | 10 | 16 |

Supporting context: the Head Start framework expects a child of 48–60 months to name at least half
of the letters (untimed). The search excerpt was cut off, so check the exact wording before quoting it.

### Number naming, Pre-K and K

Name numbers in 1 minute, with the parent tapping Right or Wrong as in the letters check. Pre-K uses
numbers 1–10; K uses 0–20.

| | Fall | Winter | Spring |
|---|---|---|---|
| Pre-K goal | 3 | 6 | 10 |
| K goal | 8 | 15 | 22 |

AIMSweb TEN Number Identification is the published 1-minute version of this task (K–1), but its
cut scores are behind the publisher's manuals, and nothing usable came up in the search.
