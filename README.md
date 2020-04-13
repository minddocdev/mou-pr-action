# MOU PR Action

Labels and checks PR title and body, and verifies commit style from branches and Github squashed merges.

[![main](https://github.com/minddocdev/mou-pr-action/workflows/main/badge.svg)](https://github.com/minddocdev/mou-pr-action/actions?workflow=main)

The `mou-pr-action` commits for `mou-pr-action`.

## Usage

Create a step on `pull_request` or `push` events.

```yaml
name: 'commit'
"on":
  pull_request:
  push:
jobs:
  check:
    name: check commit style
    runs-on: ubuntu-latest
    steps:
      - name: Checkout git repository
        uses: actions/checkout@v1.2.0
      - name: Check commits
        uses: minddocdev/mou-pr-action@master
        with:
          commitTitleLength: 72
          conventionalCommits: true
          token: ${{ github.token }}
```

## Options

### Inputs

#### `commitTitleLength`

- name: commitTitleLength
- required: false
- description: The maximum line length for the commit title. e.g. `72`.

#### `commitTitleRegex`

- name: commitTitleRegex
- required: false
- description: The regex that should validate the commit title.
e.g. `'^(?:fixup!\s*)?(\w*)(\(([\w\$\.\*/-]*)\))?\: (.*)$'`

#### `conventionalCommits`

- name: conventionalCommits
- required: false
- default: `false`
- description: Check for conventional style commits.
See [conventional commits](https://www.conventionalcommits.org/)

#### `labels`

- name: labels
- required: false
- description: The YAML or JSON map of labels with the list of file matchers.
e.g:

```yaml
  label1:
    - example/**/*
```

#### `prBodyRegex`

- name: prBodyRegex
- required: false
- description: The regex that should validate the PR body.
e.g. `'^.+(Closes|Fixes): \[(JIRA-[0-9])\]$'`

#### `prTitleLength`

- name: prTitleLength
- required: false
- description: The maximum line length for the PR title. e.g. `50`.

#### `prTitleRegex`

- name: prTitleRegex
- required: false
- description: The regex that should validate the PR title.
e.g. `'\[(JIRA-[0-9]+|CHORE|HOTFIX)\] [A-Za-z0-9]+$'`

#### `squashAndMergeBranch`

- name: squashAndMergeBranch
- required: false
- default: `<app> <version>`
- description: Enable linting for squash and merge commits into the specified branch
(e.g. `master`). The title of the commit will be verified with the given PR title rules, while the
body of the squashed commit will be split per line and verified individually with the given
commit rules. This option will only run for `push` events.

#### `token`

- name: token
- required: true
- description: The token to access Github's API.

## Development

Install dependencies

```bash
yarn
```

Compile typescript

```bash
yarn build
```

Lint code

```bash
yarn lint
```

Run the tests

```bash
yarn test
```

## References

- [Commit message checker](https://github.com/GsActions/commit-message-checker)
- [Labeler](https://github.com/actions/labeler)
