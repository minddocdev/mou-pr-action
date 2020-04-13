import * as core from '@actions/core';
import { context } from '@actions/github';

function validateConventionalCommit(message: string) {
  // eslint-disable-next-line no-useless-escape
  const match = /^(\w*)(\(([\w\$\.\*/-]+)\))?!?\: (.*)$/.exec(message);
  if (!match) {
    throw new Error(`Commit message "${message}" does not match "<type>(<scope>): <subject>"`);
  }
  const commitType = match[1];
  const commitScope = match[3];
  const commitSubject = match[4];
  core.info(
    `Detected commit type "${commitType}", scope "${commitScope}" and subject "${commitSubject}"`,
  );
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

function checkCommit(
  message: string,
  conventionalCommits: boolean,
  commitTitleLength?: string,
  commitTitleRegex?: string,
) {
  if (conventionalCommits) {
    validateConventionalCommit(message);
  }
  const title = message.split('/n')[0];
  if (commitTitleLength && title.length > parseInt(commitTitleLength, 10)) {
    throw new Error(`Commit title "${title}" exceeds "${commitTitleLength}" character length`);
  }
  if (commitTitleRegex && !checkMessage(title, commitTitleRegex)) {
    throw new Error(`Commit title "${title}" does not match regex "${commitTitleRegex}"`);
  }
  core.info(`Commit title OK: "${title}"`);
};

export function checkCommits(conventionalCommits: boolean, commitTitleLength?: string, commitTitleRegex?: string) {
  const { commits } = context.payload;
  if (!commits) {
    return;
  }

  commits.forEach(({ message }) =>
    checkCommit(message, conventionalCommits, commitTitleLength, commitTitleRegex));
}

export function checkSquashCommits(
  conventionalCommits: boolean,
  commitTitleLength?: string,
  commitTitleRegex?: string,
  prTitleLength?: string,
  prTitleRegex?: string,
) {
  const { commits } = context.payload;
  if (!commits) {
    return;
  }

  commits.forEach(({ message }) => {
    // Detect if commit is a Github squash
    if (/.* \(#[0-9]+\)\n+(\* .*\n*)+/gm.test(message)) {
      const messageLines = message.split('* ');
      // Verify commit title to match PR title regex and expected Github squash
      checkPRTitle(messageLines[0].split(' ('), prTitleLength, prTitleRegex);
      // Verify commit titles in body
      messageLines
        .slice(1)
        .forEach(messageLine =>
          checkCommit(
            messageLine.split('\n')[0],
            conventionalCommits,
            commitTitleLength,
            commitTitleRegex,
          ),
        );
    } else {
      throw new Error(`Commit "${message}" does not seem to be a Github squash.`);
    }
    core.info(`Squashed commit OK: "${message}"`);
  });
}
