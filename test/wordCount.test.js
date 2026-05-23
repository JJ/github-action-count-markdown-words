const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { countWordsInMarkdown, countRepositoryWords } = require("../src/wordCount");

test("counts only text words and excludes image captions", () => {
  const markdown = `
Text one.
![caption should not count](image.png)
Text two.
`;

  const result = countWordsInMarkdown(markdown);
  assert.equal(result.totalWords, 4);
});

test("returns section totals up to the selected depth", () => {
  const markdown = `
# Intro
alpha beta
## Details
gamma delta
### Deep
epsilon zeta
`;

  const result = countWordsInMarkdown(markdown, 2);
  assert.deepEqual(
    result.sections.map((section) => ({ level: section.level, title: section.title, words: section.words })),
    [
      { level: 1, title: "Intro", words: 2 },
      { level: 2, title: "Details", words: 2 },
    ],
  );
});

test("counts totals across markdown files in a repository", async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "md-word-count-"));
  await fs.writeFile(path.join(tempDir, "a.md"), "# A\none two", "utf8");
  await fs.mkdir(path.join(tempDir, "nested"));
  await fs.writeFile(path.join(tempDir, "nested", "b.markdown"), "alpha beta gamma", "utf8");
  await fs.writeFile(path.join(tempDir, "nested", "ignore.txt"), "one two three", "utf8");

  const result = await countRepositoryWords(tempDir, 4);
  assert.equal(result.documents.length, 2);
  assert.equal(result.repositoryTotalWords, 6);
});
