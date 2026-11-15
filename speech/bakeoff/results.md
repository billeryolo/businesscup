# Speech scoring bake-off

6 synthetic readings (two Windows voices and Kokoro) of a grade 2 and a grade 3 story, each with planted mistakes: 3 misreads (dropped endings, first-letter guesses), 2 skipped small words and a skipped line of 6 words, plus a repeated word and an "um" that must not count. Answer key from the app's own word splitting.

| Method | Mistakes caught (recall) | Flags that were real (precision) | False alarms | Avg. words-a-minute error |
|---|---|---|---|---|
| wav2vec2 alone | 85% | 89% | 7 | 0.5 |
| Whisper alone | 89% | 91% | 6 | 0.8 |
| Combined, parent skips review | 85% | 93% | 4 | 1.0 |
| Combined, parent confirms flagged words | 89% | 94% | 4 | 0.5 |

The combined method asked the parent to check 8 word(s) across all readings.

Per reading: caught / false alarms / missed (words-a-minute error), and words to check.

| Reading | Planted | wav2vec2 alone | Whisper alone | Combined, parent skips review | Combined, parent confirms flagged words | To check |
|---|---|---|---|---|---|---|
| g2-zira | 11 | 9/2/2 (+0) | 10/0/1 (+1) | 9/0/2 (+2) | 10/0/1 (+1) | 3 |
| g2-david | 11 | 7/3/4 (+1) | 8/3/3 (+0) | 7/3/4 (+1) | 8/3/3 (+0) | 1 |
| g2-kokoro | 11 | 7/2/4 (+2) | 8/1/3 (+2) | 7/1/4 (+3) | 8/1/3 (+2) | 2 |
| g3-zira | 11 | 11/0/0 (+0) | 11/2/0 (-2) | 11/0/0 (+0) | 11/0/0 (+0) | 2 |
| g3-david | 11 | 11/0/0 (+0) | 11/0/0 (+0) | 11/0/0 (+0) | 11/0/0 (+0) | 0 |
| g3-kokoro | 11 | 11/0/0 (+0) | 11/0/0 (+0) | 11/0/0 (+0) | 11/0/0 (+0) | 0 |

Caveat: synthetic adult voices are far clearer than children, so all numbers are optimistic. Re-run with real child recordings before trusting them.

## What the misses were

- **Skipped line, shifted by one copy of a repeated word.** When a line is skipped, the scoring sometimes marks an identical word nearby instead (e.g. a different "the"). The mistake count is right; only which copy gets the mark differs. This is most of the "missed" and "false alarm" pairs in g2-david and g2-kokoro.
- **Misreads the voice pronounced like the real word.** "tht" for "that" and "thy" for "They" sound the same when a synthetic voice says them, so no model can hear them. Real children's misreads are usually real, different words.
- **Names.** "Leo" counts as read whatever is heard, on purpose (names are hard for recognizers).

## Takeaways

- The combined method with the parent confirming the few flagged words is the most accurate (89% recall, 94% precision) and asks for very little (8 words across 6 readings).
- With clear synthetic voices, Whisper alone did slightly better than wav2vec2 alone. The study this design is based on found the opposite for real children, whose misreads Whisper tends to "fix"; that is why both run. A re-run with real child or imitation recordings decides it.
- Words-a-minute error was under 1 word on average for every method, well inside the 4 to 18 word measurement error of any 1-minute reading.
