# Benchmarks for the 1-minute checks

Where each "goal" and "typical for the grade" number comes from. The school year is split as in
`src/lib/reading/norms.ts`: fall = Aug–Nov (beginning of year), winter = Dec–Feb (middle),
spring = Mar–Jul (end). The result screen names the source under the bar.

## Which check each grade gets (`checksFor` in `src/lib/checks/quick.ts`)

| Grade | Reading | Letters | Math |
|---|---|---|---|
| Pre-K | — | Capital letters: **app goal** | — |
| K | — | Capital and small letters: **DIBELS 8** | Adding up to 5: **app goal** |
| 1–4 | Story read aloud: **Hasbrouck & Tindal 2017** | — | Facts: **Rocket Math** |

## Reading, grades 1–4: Hasbrouck & Tindal (2017), published

Words correct per minute, percentiles by grade and season, in `src/lib/reading/norms.ts`. "Needs
practice" at 10+ words below the median or under 95% accuracy; "talk to the teacher" below the 25th
percentile or under 90% accuracy (`src/lib/reading/assess.ts`). Grade 1 has no fall norm, so the
winter norm is used and speed alone never triggers "talk to the teacher".

## Letters, kindergarten: DIBELS 8 Letter Naming Fluency, published

Correct letter names in a minute, the minimum for "core support":

| | Fall | Winter | Spring |
|---|---|---|---|
| Kindergarten | 25 | 37 | 42 |

Source: [DIBELS 8th Edition Benchmark Goals](https://dibels.uoregon.edu/sites/default/files/2024-01/dibels8_benchmark_goals.pdf),
University of Oregon, goals updated July 2020. The "strategic support" band below it is 16, 31 and
35. (Grade 1 goals are 42, 57 and 59, if letters are ever offered in grade 1.)

## Math, grades 1–4: Rocket Math fact fluency, published by the vendor

Written problems correct per minute, for the facts each grade's check uses:

| Grade | Check | Fall | Winter | Spring |
|---|---|---|---|---|
| 1 | Adding up to 10 | 12 | 25 | 25 |
| 2 | Adding and taking away up to 20 | 25 | 21 | 28 |
| 3 | Times tables 2, 3, 4, 5, 10 | 30 | 30 | 30 |
| 4 | Times tables up to 10 | 35 | 35 | 35 |

Grade 2 from winter mixes addition (30) and subtraction (12, then 25), so the goal is their average.
Grade 3 has no multiplication goal in the fall; the winter goal (30) is used. Source:
[Rocket Math Fact Fluency Benchmarks](https://www.rocketmath.com/wp-content/uploads/2024/09/Math_Fact_Fluency_Benchmarks_2024.pdf),
2024, based on the vendor's classroom data rather than peer-reviewed norms. The grade 4 rows in the
PDF print "Subtraction 35" twice where multiplication is expected; it is read as × 35.

These goals are for fluent written answers. Tapping answers on a phone may be slower, so the result
says "Needs practice" rather than "Talk to the teacher" for math and letters.

## App goals (no published per-minute benchmark found)

| Check | Goal |
|---|---|
| Pre-K capital letters | 13 a minute |
| Kindergarten adding up to 5 | 8 a minute |

Context: the Head Start framework expects 4–5-year-olds to name at least half of the letters
(untimed). Number and early-math fluency tests (e.g. AIMSweb TEN) publish their cut scores only in
the publisher's manuals.
