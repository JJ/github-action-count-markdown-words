const core = require("@actions/core");
const path = require("node:path");
const { countRepositoryWords } = require("./wordCount");

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

function formatTable(headers, rows) {
  const headerRow = `| ${headers.join(" | ")} |`;
  const separatorRow = `| ${headers.map(() => "---").join(" | ")} |`;
  const bodyRows = rows.map((row) => `| ${row.join(" | ")} |`);
  return [headerRow, separatorRow, ...bodyRows].join("\n");
}

async function publishSummary(results) {
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
    await core.summary
      .addHeading("Markdown word count")
      .addRaw(`${documentTable}\n\n`, true)
      .addRaw(`**Repository total words:** ${results.repositoryTotalWords}\n\n`, true)
      .write();
  } catch (error) {
    core.info(`Workflow summary unavailable: ${error.message}`);
  }
}

async function run() {
  try {
    const targetPath = core.getInput("path") || ".";
    const absolutePath = path.resolve(targetPath);
    const depth = parseDepth(core.getInput("depth"));
    const results = await countRepositoryWords(absolutePath, depth);

    await publishSummary(results);

    core.setOutput("repository_total_words", String(results.repositoryTotalWords));
    core.setOutput("results_json", JSON.stringify(results));
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
