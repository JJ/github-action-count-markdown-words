# github-action-count-markdown-words

GitHub Action to count words in markdown files for:
- each document total
- each section (by heading level, configurable)
- repository-wide total

## Features

- Counts text words from markdown content
- Excludes image caption text (for example `![caption](img.png)`)
- Reports per-document totals and per-section totals
- Supports section depth input (`depth`); by default all heading levels are included
- Publishes results in CI logs using `info` tables and in the workflow summary

## Inputs

| Name | Required | Default | Description |
| --- | --- | --- | --- |
| `path` | No | `.` | Root directory to scan for markdown files |
| `depth` | No | _(all levels)_ | Maximum heading depth to include in section tables |

## Outputs

| Name | Description |
| --- | --- |
| `repository_total_words` | Total words in all scanned markdown files |
| `results_json` | JSON payload with document totals and section breakdowns |

## Usage

```yaml
name: Count markdown words
on: [push, pull_request]

jobs:
  words:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: JJ/github-action-count-markdown-words@v1
        with:
          path: .
          depth: 4
```

## Development

Install dependencies:

```bash
npm install
```

Run tests:

```bash
npm test
```

Build single-file action bundle with ncc:

```bash
npm run build
```
