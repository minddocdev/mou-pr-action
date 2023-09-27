import * as core from '@actions/core';
import { context } from '@actions/github';
import * as yaml from 'js-yaml';

import { labelPR } from './lib/labeler';
import { checkCommits, checkPR } from './lib/style';
import { Octokit } from '@octokit/rest';

function getLabelerConfig() {
  const rawLabels = core.getInput('labels', { required: false });
  core.debug(`Parsing raw labels config '${rawLabels}'...`);
  let labelConfig: unknown;
  try {
    // Try JSON first
    labelConfig = JSON.parse(rawLabels);
    core.debug(`Loaded labels: ${rawLabels}`);
  } catch (jsonError) {
    // Try YAML format
    try {
      labelConfig = yaml.load(rawLabels);
    } catch (yamlError) {
      throw new Error(`Unable to parse labels. Found content: "${rawLabels}"`);
    }
  }

  const labelGlobs: Map<string, string[]> = new Map();
  Object.keys(labelConfig!).forEach((label) => {
    if (typeof labelConfig![label] === 'string') {
      labelGlobs.set(label, [labelConfig![label]]);
    } else if (labelConfig![label] instanceof Array) {
      labelGlobs.set(label, labelConfig![label]);
    } else {
      throw Error(`Unexpected type for label "${label}" (should be string or array of globs)`);
    }
  });

  return labelGlobs;
}

export async function run() {
  try {
    const prTitleRegex = core.getInput('prTitleRegex', { required: false });
    const prTitleLength = core.getInput('prTitleLength', { required: false });
    const client = new Octokit({ auth: core.getInput('token', { required: true }) });
    const { eventName } = context;
    switch (eventName) {
      case 'push': {
        const commitTitleLength = core.getInput('commitTitleLength', { required: false });
        const commitTitleRegex = core.getInput('commitTitleRegex', { required: false });
        const conventionalCommits =
          core.getInput('conventionalCommits', { required: false }) === 'true' || false;
        checkCommits(conventionalCommits, commitTitleLength, commitTitleRegex);
        break;
      }
      case 'pull_request': {
        await labelPR(client, getLabelerConfig());
        checkPR(core.getInput('prBodyRegex', { required: false }), prTitleLength, prTitleRegex);
        break;
      }
      default: {
        throw new Error(`Unsupported "${eventName}" event.`);
      }
    }
  } catch (error: any) {
    core.setFailed(error.message);
  }
}
