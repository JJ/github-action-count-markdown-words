const fs = require("node:fs/promises");
const path = require("node:path");
const { unified } = require("unified");
const remarkParse = require("remark-parse").default;

const WORD_REGEX = /[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu;
const SKIPPED_NODE_TYPES = new Set(["image", "imageReference", "code", "inlineCode", "html"]);

function countWordsFromText(text) {
  const matches = text.match(WORD_REGEX);
  return matches ? matches.length : 0;
}

function collectText(node, parts) {
  if (!node || SKIPPED_NODE_TYPES.has(node.type)) {
    return;
  }

  if (node.type === "text" && node.value) {
    parts.push(node.value);
  }

  if (node.type === "break" || node.type === "thematicBreak") {
    parts.push(" ");
  }

  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      collectText(child, parts);
    }
  }
}

function textFromNodes(nodes) {
  const parts = [];

  for (const node of nodes) {
    collectText(node, parts);
    parts.push(" ");
  }

  return parts.join(" ");
}

function headingsFromChildren(children) {
  const headings = [];

  children.forEach((node, index) => {
    if (node.type === "heading") {
      headings.push({ index, depth: node.depth, title: textFromNodes([node]).trim() });
    }
  });

  return headings;
}

function sectionData(children, maxDepth = Number.POSITIVE_INFINITY) {
  const headings = headingsFromChildren(children);
  const sections = [];

  headings.forEach((heading, headingIndex) => {
    if (heading.depth > maxDepth) {
      return;
    }

    const nextHeadingIndex = headings[headingIndex + 1]?.index ?? children.length;
    const contentNodes = children.slice(heading.index + 1, nextHeadingIndex);
    sections.push({
      level: heading.depth,
      title: heading.title || "(untitled)",
      words: countWordsFromText(textFromNodes(contentNodes)),
    });
  });

  return sections;
}

function countWordsInMarkdown(markdownText, maxDepth) {
  const processor = unified().use(remarkParse);
  const tree = processor.parse(markdownText);

  return {
    totalWords: countWordsFromText(textFromNodes(tree.children)),
    sections: sectionData(tree.children, maxDepth),
  };
}

async function findMarkdownFiles(rootPath, excludeFilePaths = []) {
  const files = [];
  const root = path.resolve(rootPath);
  const excludedPaths = new Set(
    excludeFilePaths
      .map((excludePath) => {
        const trimmedPath = String(excludePath || "").trim();
        if (!trimmedPath) {
          return "";
        }

        const resolvedPath = path.resolve(root, trimmedPath);
        const relativeResolvedPath = path.relative(root, resolvedPath);
        if (
          relativeResolvedPath &&
          !relativeResolvedPath.startsWith("..") &&
          !path.isAbsolute(relativeResolvedPath)
        ) {
          return relativeResolvedPath;
        }

        return trimmedPath;
      })
      .map((excludePath) => excludePath.replace(/^\.([/\\]|$)/, ""))
      .map((excludePath) => path.normalize(excludePath).split(path.sep).join("/"))
      .filter(Boolean),
  );

  function normalizeRelativePath(value) {
    return value.split(path.sep).join("/");
  }

  async function walk(currentPath) {
    const entries = await fs.readdir(currentPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === ".git" || entry.name === "node_modules") {
          continue;
        }
        await walk(fullPath);
        continue;
      }
      if (entry.isFile()) {
        const lowerName = entry.name.toLowerCase();
        if (
          lowerName.endsWith(".md") ||
          lowerName.endsWith(".markdown") ||
          lowerName.endsWith(".rmd") ||
          lowerName.endsWith(".qmd")
        ) {
          const relativePath = path.relative(root, fullPath);
          if (!excludedPaths.has(normalizeRelativePath(relativePath))) {
            files.push(fullPath);
          }
        }
      }
    }
  }

  await walk(root);
  files.sort();
  return files;
}

async function countRepositoryWords(rootPath, maxDepth, excludeFilePaths = []) {
  const files = await findMarkdownFiles(rootPath, excludeFilePaths);
  const documents = [];
  let repositoryTotalWords = 0;

  for (const file of files) {
    const markdown = await fs.readFile(file, "utf8");
    const result = countWordsInMarkdown(markdown, maxDepth);
    const relativePath = path.relative(path.resolve(rootPath), file) || path.basename(file);
    documents.push({
      path: relativePath,
      totalWords: result.totalWords,
      sections: result.sections,
    });
    repositoryTotalWords += result.totalWords;
  }

  return { documents, repositoryTotalWords };
}

module.exports = {
  countWordsFromText,
  textFromNodes,
  countWordsInMarkdown,
  countRepositoryWords,
};
