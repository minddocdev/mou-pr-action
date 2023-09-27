import * as core from '@actions/core';
import { context } from '@actions/github';
import { Octokit } from '@octokit/rest';
import { Minimatch } from 'minimatch';
async function addLabels(client: Octokit, labels: string[], prNumber: number) {
  const { owner, repo } = context.repo;
  await client.issues.addLabels({
    labels,
    owner,
    repo,
    issue_number: prNumber,
  });
}

async function getChangedFiles(client: Octokit, prNumber: number): Promise<string[]> {
  const { owner, repo } = context.repo;
  const listFilesResponse = await client.pulls.listFiles({
    owner,
    repo,
    pull_number: prNumber,
  });

  const changedFiles: string[] = listFilesResponse.data.map((f) => f.filename);

  core.debug('Found changed files:');
  changedFiles.forEach((file) => core.debug(`changed file: ${file}`));
  return changedFiles;
}

function checkGlob(changedFiles: string[], glob: string): boolean {
  core.debug(`Checking pattern "${glob}"...`);
  const matcher = new Minimatch(glob);
  // eslint-disable-next-line no-restricted-syntax
  for (const changedFile of changedFiles) {
    core.debug(`- ${changedFile}`);
    if (matcher.match(changedFile)) {
      core.debug(`"${changedFile}" matches`);
      return true;
    }
  }
  return false;
}

export async function labelPR(client: Octokit, labelGlobs: Map<string, string[]>) {
  const { pull_request: pr } = context.payload;
  if (!pr) {
    return;
  }

  // Retrieve list of changed files in the PR
  const changedFiles: string[] = await getChangedFiles(client, pr.number);

  // Discover labels that match the loaded globs
  const labels = new Set<string>();
  labelGlobs.forEach((globs, label) => {
    core.debug(`Processing "${label}"...`);
    globs.forEach((glob) => {
      if (checkGlob(changedFiles, glob)) {
        labels.add(label);
      }
    });
  });

  // Add detected labels to the PR
  if (labels.size > 0) {
    await addLabels(client, [...labels], pr.number);
  }
}
