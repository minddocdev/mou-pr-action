import * as core from '@actions/core';
import lint from '@commitlint/lint';
import { context } from '@actions/github';

// Extracted from
// https://github.com/conventional-changelog/commitlint/tree/master/%40commitlint/config-conventional
const conventionalCommitRules = {
  'body-leading-blank': [1, 'always'],
  'body-max-line-length': [2, 'always', 100],
  'footer-leading-blank': [1, 'always'],
  'footer-max-line-length': [2, 'always', 100],
  'header-max-length': [2, 'always', 100],
  'scope-case': [2, 'always', 'lower-case'],
  'subject-case': [2, 'never', ['sentence-case', 'start-case', 'pascal-case', 'upper-case']],
  'subject-empty': [2, 'never'],
  'subject-full-stop': [2, 'never', '.'],
  'type-case': [2, 'always', 'lower-case'],
  'type-empty': [2, 'never'],
  'type-enum': [
    2,
    'always',
    [
      'build',
      'chore',
      'ci',
      'config',
      'docs',
      'feat',
      'fix',
      'perf',
      'refactor',
      'revert',
      'style',
      'test',
    ],
  ],
};

async function validateConventionalCommit(message: string) {
  const { valid, errors, warnings } = await lint(message, conventionalCommitRules);
  warnings.forEach((warning) => {
    core.warning(`Commit "${message}" has a "${warning.name}" warning: ${warning.message}`);
  });
  errors.forEach(error => {
    core.error(`Commit "${message}" has a "${error.name}" error: ${error.message}`);
  });
  if (!valid) {
    throw new Error(`Commit "${message}" does not match conventional commit rules`);
  }
  core.info(`Commit "${message}" complies with conventional commit rules`);
}

function checkMessage(message: string, pattern: string): boolean {
  const regex = new RegExp(pattern);
  return regex.test(message);
}

function checkPRTitle(prTitle: string, prTitleLength?: string, prTitleRegex?: string) {
  if (prTitleLength && prTitle.length > parseInt(prTitleLength, 10)) {
    throw new Error(`PR title "${prTitle}" exceeds "${prTitleLength}" character length`);
  }
  if (prTitleRegex && !checkMessage(prTitle, prTitleRegex)) {
    throw new Error(`PR title "${prTitle}" does not match regex "${prTitleRegex}"`);
  }
  core.info(`PR title OK: "${prTitle}"`);
}

export function checkPR(prBodyRegex?: string, prTitleLength?: string, prTitleRegex?: string) {
  const { pull_request: pr } = context.payload;
  if (!pr) {
    return;
  }

  if (prBodyRegex && pr.body) {
    if (!checkMessage(pr.body, prBodyRegex)) {
      throw new Error(`PR body "${pr.body}" does not match regex "${prBodyRegex}"`);
    }
    core.info(`PR body OK: "${pr.body}"`);
  }

  if (pr.title) {
    checkPRTitle(pr.title, prTitleLength, prTitleRegex);
  }
}

async function checkCommit(
  message: string,
  conventionalCommits: boolean,
  commitTitleLength?: string,
  commitTitleRegex?: string,
) {
  if (conventionalCommits) {
    await validateConventionalCommit(message);
  }
  const title = message.split('\n')[0];
  if (commitTitleLength && title.length > parseInt(commitTitleLength, 10)) {
    throw new Error(`Commit title "${title}" exceeds "${commitTitleLength}" character length`);
  }
  if (commitTitleRegex && !checkMessage(title, commitTitleRegex)) {
    throw new Error(`Commit title "${title}" does not match regex "${commitTitleRegex}"`);
  }
  core.info(`Commit title OK: "${title}"`);
};

export async function checkCommits(conventionalCommits: boolean, commitTitleLength?: string, commitTitleRegex?: string) {
  const { commits } = context.payload;
  if (!commits) {
    return;
  }

  // eslint-disable-next-line no-restricted-syntax
  for (const { message } of commits) {
    // eslint-disable-next-line no-await-in-loop
    await checkCommit(message, conventionalCommits, commitTitleLength, commitTitleRegex);
    // Detect if commit is a Github squash
    if (/.* \(#[0-9]+\)\n+(\* .*\n*)+/gm.test(message)) {
      // Verify that all body lines are valid commits
      const messageLines = message.split('* ');
      // eslint-disable-next-line no-restricted-syntax
      for (const messageLine of messageLines.slice(1)) {
        // eslint-disable-next-line no-await-in-loop
        await checkCommit(
          messageLine.split('\n')[0],
          conventionalCommits,
          commitTitleLength,
          commitTitleRegex,
        );
      }
      core.info(`Squashed commit OK: "${message}"`);
    }
  }
}
