# github-action-count-markdown-words

GitHub Action to count words in markdown files for:
- each document total
- each section (by heading level, configurable)
- repository-wide total

Scanned file extensions: `.md`, `.markdown`, `.Rmd`, `.qmd`.

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
| `exclude` | No | `README.md` | Comma/newline-separated markdown file paths to exclude (relative to `path`) |

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
      - uses: actions/checkout@v6
      - uses: JJ/github-action-count-markdown-words@v1
        with:
          path: .
          depth: 4
          exclude: |
            README.md
            docs/generated.md
```

This is going to generate a markdown summary, which you can check at the
"actions" tab of your repo, like this one:

<h1>Markdown word count</h1>
<table><tr><th>Document</th><th>Total words</th></tr><tr><td>portafolio-edad-moderna.qmd</td><td>1919</td></tr></table>

**Repository total words:** 1919


<h3>Sections for portafolio-edad-moderna.qmd</h3>
<table><tr><th>Level</th><th>Section</th><th>Words</th></tr><tr><td>1</td><td>Portafolio de Historia del Arte de la Edad Moderna en España</td><td>106</td></tr><tr><td>2</td><td>Palacio del Marqués de Santa Cruz en el Viso del Marqués</td><td>213</td></tr><tr><td>3</td><td>Arquitectura del palacio del Marqués de Santa Cruz</td><td>11</td></tr><tr><td>4</td><td>Autor</td><td>81</td></tr><tr><td>4</td><td>Cronología</td><td>32</td></tr><tr><td>4</td><td>Tipología</td><td>45</td></tr><tr><td>4</td><td>Análisis descriptivo</td><td>957</td></tr><tr><td>3</td><td>Esculturas de la escalera</td><td>58</td></tr><tr><td>4</td><td>Autor</td><td>41</td></tr><tr><td>4</td><td>Cronología</td><td>24</td></tr><tr><td>4</td><td>Tipología</td><td>66</td></tr><tr><td>4</td><td>Análisis descriptivo</td><td>135</td></tr><tr><td>3</td><td>Frescos del edificio</td><td>0</td></tr><tr><td>4</td><td>Autor</td><td>0</td></tr><tr><td>4</td><td>Cronología</td><td>0</td></tr><tr><td>4</td><td>Tipología:</td><td>0</td></tr><tr><td>4</td><td>Análisis descriptivo</td><td>0</td></tr><tr><td>3</td><td>Contexto histórico-cultural</td><td>0</td></tr><tr><td>4</td><td>Autor</td><td>0</td></tr><tr><td>4</td><td>Cronología</td><td>0</td></tr><tr><td>4</td><td>Tipología:</td><td>0</td></tr><tr><td>4</td><td>Análisis descriptivo</td><td>0</td></tr><tr><td>4</td><td>Contexto histórico-cultural</td><td>0</td></tr><tr><td>4</td><td>Autor</td><td>0</td></tr><tr><td>4</td><td>Cronología</td><td>0</td></tr><tr><td>4</td><td>Tipología:</td><td>0</td></tr><tr><td>4</td><td>Análisis descriptivo</td><td>0</td></tr><tr><td>4</td><td>Contexto histórico-cultural</td><td>0</td></tr><tr><td>4</td><td>Autor</td><td>0</td></tr><tr><td>4</td><td>Cronología</td><td>0</td></tr><tr><td>4</td><td>Tipología:</td><td>0</td></tr><tr><td>4</td><td>Análisis descriptivo</td><td>0</td></tr><tr><td>4</td><td>Contexto histórico-cultural</td><td>0</td></tr><tr><td>4</td><td>Autor</td><td>0</td></tr><tr><td>4</td><td>Cronología</td><td>0</td></tr><tr><td>4</td><td>Tipología:</td><td>0</td></tr><tr><td>4</td><td>Análisis descriptivo</td><td>0</td></tr><tr><td>4</td><td>Contexto histórico-cultural</td><td>0</td></tr><tr><td>4</td><td>Autor</td><td>0</td></tr><tr><td>4</td><td>Cronología</td><td>0</td></tr><tr><td>4</td><td>Tipología:</td><td>0</td></tr><tr><td>4</td><td>Análisis descriptivo</td><td>0</td></tr><tr><td>4</td><td>Contexto histórico-cultural</td><td>0</td></tr><tr><td>4</td><td>Autor</td><td>0</td></tr><tr><td>4</td><td>Cronología</td><td>0</td></tr><tr><td>4</td><td>Tipología:</td><td>0</td></tr><tr><td>4</td><td>Análisis descriptivo</td><td>0</td></tr><tr><td>4</td><td>Contexto histórico-cultural</td><td>0</td></tr><tr><td>2</td><td>Créditos de las imágenes</td><td>17</td></tr><tr><td>2</td><td>Referencias</td><td>0</td></tr></table>



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

## License

This is (c) JJ Merelo and is licensed under the AGPL v3. See [LICENSE](LICENSE)
for details.
