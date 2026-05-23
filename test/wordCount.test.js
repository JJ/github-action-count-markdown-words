const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { countWordsInMarkdown, countRepositoryWords } = require("../src/wordCount");

const FIXTURES_DIR = path.join(__dirname, "fixtures");

test("counts only text words and excludes image captions", () => {
  const markdown = `
Text one.
![caption should not count](image.png)
Text two.
`;

  const result = countWordsInMarkdown(markdown);
  assert.equal(result.totalWords, 4);
});

test("counts zero words for markdown containing only skipped node types", () => {
  const markdown = [
    "![caption should not count](image.png)",
    "",
    "`inline code words should not count`",
    "",
    "```js",
    'const value = "block code words should not count";',
    "```",
    "",
    "<img src=\"image.png\"/>",
    "",
    "![ref caption should not count][img]",
    "",
    "[img]: image.png",
  ].join("\n");

  const result = countWordsInMarkdown(markdown);
  assert.equal(result.totalWords, 0);
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

test("excludes configured markdown files from repository totals", async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "md-word-count-exclude-"));
  await fs.writeFile(path.join(tempDir, "README.md"), "alpha beta gamma", "utf8");
  await fs.writeFile(path.join(tempDir, "notes.md"), "one two", "utf8");

  const result = await countRepositoryWords(tempDir, Number.POSITIVE_INFINITY, ["README.md"]);
  assert.deepEqual(result.documents.map((document) => document.path), ["notes.md"]);
  assert.equal(result.repositoryTotalWords, 2);
});

test("counts words in .Rmd and .qmd files", async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "md-word-count-ext-"));
  await fs.writeFile(path.join(tempDir, "analysis.Rmd"), "alpha beta", "utf8");
  await fs.writeFile(path.join(tempDir, "report.qmd"), "one two three", "utf8");

  const result = await countRepositoryWords(tempDir, Number.POSITIVE_INFINITY);
  assert.deepEqual(
    result.documents.map((document) => document.path),
    ["analysis.Rmd", "report.qmd"],
  );
  assert.equal(result.repositoryTotalWords, 5);
});

test("counts section words at every heading level in a .md fixture", async () => {
  const content = await fs.readFile(path.join(FIXTURES_DIR, "multi-level.md"), "utf8");
  const result = countWordsInMarkdown(content);

  assert.equal(result.totalWords, 18);
  assert.deepEqual(
    result.sections.map((s) => ({ level: s.level, title: s.title, words: s.words })),
    [
      { level: 1, title: "Introduction", words: 4 },
      { level: 2, title: "Background", words: 4 },
      { level: 3, title: "Details", words: 3 },
      { level: 2, title: "Summary", words: 3 },
    ],
  );
});

test("counts section words at every heading level in a .qmd fixture", async () => {
  const content = await fs.readFile(path.join(FIXTURES_DIR, "report.qmd"), "utf8");
  const result = countWordsInMarkdown(content);

  assert.equal(result.totalWords, 21);
  assert.deepEqual(
    result.sections.map((s) => ({ level: s.level, title: s.title, words: s.words })),
    [
      { level: 1, title: "Report Title", words: 5 },
      { level: 2, title: "Findings", words: 4 },
      { level: 3, title: "Analysis", words: 4 },
      { level: 2, title: "Conclusions", words: 3 },
    ],
  );
});

test("counts section words at every heading level in a .Rmd fixture", async () => {
  const content = await fs.readFile(path.join(FIXTURES_DIR, "analysis.Rmd"), "utf8");
  const result = countWordsInMarkdown(content);

  assert.equal(result.totalWords, 22);
  assert.deepEqual(
    result.sections.map((s) => ({ level: s.level, title: s.title, words: s.words })),
    [
      { level: 1, title: "Analysis Document", words: 3 },
      { level: 2, title: "Methods", words: 4 },
      { level: 3, title: "Data Sources", words: 5 },
      { level: 2, title: "Results", words: 4 },
    ],
  );
});

test("counts section words at every heading level in a .markdown fixture", async () => {
  const content = await fs.readFile(path.join(FIXTURES_DIR, "notes.markdown"), "utf8");
  const result = countWordsInMarkdown(content);

  assert.equal(result.totalWords, 22);
  assert.deepEqual(
    result.sections.map((s) => ({ level: s.level, title: s.title, words: s.words })),
    [
      { level: 1, title: "Notes", words: 4 },
      { level: 2, title: "Section One", words: 4 },
      { level: 2, title: "Section Two", words: 4 },
      { level: 3, title: "Sub-section", words: 4 },
    ],
  );
});

test("scans fixture directory and reports all supported extensions with sections", async () => {
  const result = await countRepositoryWords(FIXTURES_DIR);

  assert.deepEqual(
    result.documents.map((d) => d.path),
    ["analysis.Rmd", "multi-level.md", "notes.markdown", "report.qmd"],
  );
  assert.equal(result.repositoryTotalWords, 83);

  for (const document of result.documents) {
    assert.ok(document.sections.length > 0, `${document.path} should have sections`);
  }
});

test("respects depth limit when counting sections across fixture files", async () => {
  const content = await fs.readFile(path.join(FIXTURES_DIR, "multi-level.md"), "utf8");
  const result = countWordsInMarkdown(content, 2);

  assert.deepEqual(
    result.sections.map((s) => ({ level: s.level, title: s.title })),
    [
      { level: 1, title: "Introduction" },
      { level: 2, title: "Background" },
      { level: 2, title: "Summary" },
    ],
  );
});
