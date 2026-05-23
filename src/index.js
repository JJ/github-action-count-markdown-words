const path = require("node:path");
const { countRepositoryWords } = require("./wordCount");
let corePromise;

async function getCore() {
  if (!corePromise) {
    corePromise = import("@actions/core");
  }

  return corePromise;
}

function parseDepth(depthInput) {
  if (!depthInput || !depthInput.trim()) {
    return Number.POSITIVE_INFINITY;
  }

  const parsedDepth = Number.parseInt(depthInput, 10);
  if (Number.isNaN(parsedDepth) || parsedDepth < 1) {
    throw new Error("Input 'depth' must be a positive integer.");
  }

  return parsedDepth;
}

function parseExcludeInput(excludeInput) {
  if (!excludeInput || !excludeInput.trim()) {
    return [];
  }

  return excludeInput
    .split(/[\n,]/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function formatTable(headers, rows) {
  const headerRow = `| ${headers.join(" | ")} |`;
  const separatorRow = `| ${headers.map(() => "---").join(" | ")} |`;
  const bodyRows = rows.map((row) => `| ${row.join(" | ")} |`);
  return [headerRow, separatorRow, ...bodyRows].join("\n");
}

async function publishSummary(results) {
  const core = await getCore();
  const documentRows = results.documents.map((document) => [document.path, String(document.totalWords)]);
  const documentTable = formatTable(["Document", "Total words"], documentRows);

  core.info("Markdown word count summary");
  core.info(documentTable);
  core.info(`Repository total words: ${results.repositoryTotalWords}`);

  for (const document of results.documents) {
    if (!document.sections.length) {
      continue;
    }

    const sectionTable = formatTable(
      ["Level", "Section", "Words"],
      document.sections.map((section) => [String(section.level), section.title, String(section.words)]),
    );
    core.info(`Sections for ${document.path}`);
    core.info(sectionTable);
  }

  try {
    const summary = core.summary
      .addHeading("Markdown word count")
      .addTable([
        [
          { data: "Document", header: true },
          { data: "Total words", header: true },
        ],
        ...documentRows,
      ])
      .addRaw(`\n**Repository total words:** ${results.repositoryTotalWords}\n\n`, true);

    for (const document of results.documents) {
      if (!document.sections.length) {
        continue;
      }

      summary
        .addHeading(`Sections for ${document.path}`, 3)
        .addTable([
          [
            { data: "Level", header: true },
            { data: "Section", header: true },
            { data: "Words", header: true },
          ],
          ...document.sections.map((section) => [String(section.level), section.title, String(section.words)]),
        ]);
    }

    await summary.write();
  } catch (error) {
    core.info(`Workflow summary unavailable: ${error.message}`);
  }
}

async function run() {
  let core;
  try {
    core = await getCore();
    const targetPath = core.getInput("path") || ".";
    const absolutePath = path.resolve(targetPath);
    const depth = parseDepth(core.getInput("depth"));
    const excludePaths = parseExcludeInput(core.getInput("exclude"));
    const results = await countRepositoryWords(absolutePath, depth, excludePaths);

    await publishSummary(results);

    core.setOutput("repository_total_words", String(results.repositoryTotalWords));
    core.setOutput("results_json", JSON.stringify(results));
  } catch (error) {
    if (core) {
      core.setFailed(error.message);
      return;
    }

    throw error;
  }
}

run();
