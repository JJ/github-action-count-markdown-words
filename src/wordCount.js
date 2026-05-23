const fs = require("node:fs/promises");
const path = require("node:path");
const { unified } = require("unified");
const remarkParse = require("remark-parse").default;
const { visit } = require("unist-util-visit");

const WORD_REGEX = /[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu;

function countWordsFromText(text) {
  const matches = text.match(WORD_REGEX);
  return matches ? matches.length : 0;
}

function textFromNodes(nodes) {
  const parts = [];

  for (const node of nodes) {
    visit(node, (current) => {
      if (current.type === "image" || current.type === "imageReference") {
        return "skip";
      }
      if (current.type === "code" || current.type === "inlineCode") {
        return "skip";
      }
      if (current.type === "html") {
        return "skip";
      }
      if (current.type === "text" && current.value) {
        parts.push(current.value);
      }
      if (current.type === "break" || current.type === "thematicBreak") {
        parts.push(" ");
      }
    });
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

async function findMarkdownFiles(rootPath) {
  const files = [];
  const root = path.resolve(rootPath);

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
        if (lowerName.endsWith(".md") || lowerName.endsWith(".markdown")) {
          files.push(fullPath);
        }
      }
    }
  }

  await walk(root);
  files.sort();
  return files;
}

async function countRepositoryWords(rootPath, maxDepth) {
  const files = await findMarkdownFiles(rootPath);
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
