import { getInput, setFailed } from '@actions/core';
import { context } from '@actions/github';
import { Octokit } from '@octokit/rest';

import { labelPR } from '@minddocdev/mou-pr-action/lib/labeler';
import { checkCommits, checkPR } from '@minddocdev/mou-pr-action/lib/style';

import { run } from '@minddocdev/mou-pr-action/main';

jest.mock('@actions/github');
jest.mock('@actions/core');
jest.mock('@minddocdev/mou-pr-action/lib/labeler');
jest.mock('@minddocdev/mou-pr-action/lib/style');

describe('run', () => {
  // Commit config
  const commitTitleLength = '72';
  const commitTitleRegex = '^(?:fixup!s*)?(w*)((([w$.*/-]*)))?: (.*)$';
  // Labeler config
  const labels = 'mylabel: myglob';
  // PR config
  const prBodyRegex = '^.+(Closes|Fixes): [(JIRA-[0-9])]$';
  const prTitleLength = '50';
  const prTitleRegex = '[(JIRA-[0-9]+|CHORE|HOTFIX)] [A-Za-z0-9]+$';
  // Github token
  const token = 'faketoken';
  const mockInput = (mockLabels = labels) => {
    (getInput as jest.Mock).mockImplementation((name: string) => {
      switch (name) {
        case 'commitTitleLength':
          return commitTitleLength;
        case 'commitTitleRegex':
          return commitTitleRegex;
        case 'labels':
          return mockLabels;
        case 'prBodyRegex':
          return prBodyRegex;
        case 'prTitleLength':
          return prTitleLength;
        case 'prTitleRegex':
          return prTitleRegex;
        case 'token':
          return token;
        default:
          return undefined;
      }
    });
  };

  test('push event', async () => {
    context.eventName = 'push';
    mockInput();

    await run();

    expect(checkCommits).toBeCalledWith(false, commitTitleLength, commitTitleRegex);
    expect(labelPR).not.toBeCalled();
    expect(checkPR).not.toBeCalled();
    expect(setFailed).not.toBeCalled();
  });

  test('pr event', async () => {
    context.eventName = 'pull_request';
    mockInput('{ "myLabel1": ["glob1", "glob2"], "myLabel2": "glob" }');
    const labelGlobs = new Map();
    labelGlobs.set('myLabel1', ['glob1', 'glob2']);
    labelGlobs.set('myLabel2', ['glob']);

    await run();

    expect(checkCommits).not.toBeCalled();
    expect(labelPR).toBeCalledWith(expect.any(Octokit), labelGlobs);
    expect(checkPR).toBeCalledWith(prBodyRegex, prTitleLength, prTitleRegex);
    expect(setFailed).not.toBeCalled();
  });

  test('unknown event', async () => {
    const fakeEvent = 'unknown';
    context.eventName = fakeEvent;

    await run();
    expect(setFailed).toBeCalledWith(`Unsupported "${fakeEvent}" event.`);
  });

  test('invalid label config format', async () => {
    context.eventName = 'pull_request';
    const badLabels = '{}false:';
    mockInput(badLabels);
    await run();
    expect(setFailed).toBeCalledWith(`Unable to parse labels. Found content: "${badLabels}"`);
  });

  test('invalid label config type', async () => {
    context.eventName = 'pull_request';
    mockInput('mylabel: 3');
    await run();
    expect(setFailed).toBeCalledWith(
      'Unexpected type for label "mylabel" (should be string or array of globs)',
    );
  });

  test('input error', async () => {
    const errorMsg = 'fake';
    (getInput as jest.Mock).mockImplementationOnce(() => {
      throw new Error(errorMsg);
    });

    await run();
    expect(setFailed).toBeCalledWith(errorMsg);
  });
});
