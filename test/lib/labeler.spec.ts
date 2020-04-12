import * as core from '@actions/core';
import { context } from '@actions/github';

import { labelPR } from '@minddocdev/mou-pr-action/lib/labeler';

jest.mock('@actions/github', () => ({
  context: {
    repo: {
      owner: 'myorg',
      repo: 'myrepo',
    },
    payload: {
      pull_request: {},
    },
  },
}));
jest.mock('@actions/core');

describe('labeler', () => {
  const owner = 'myorg';
  const repo = 'myrepo';
  const addLabels = jest.fn();
  const listFiles = jest.fn();
  const mockGithub = (): any => {
    return {
      issues: { addLabels },
      pulls: { listFiles },
    };
  };
  const labelGlobs = new Map();
  labelGlobs.set('myLabel1', ['folder1/**/*', 'folder1/**/*']);
  labelGlobs.set('myLabel2', ['**/*.md']);
  labelGlobs.set('myLabel3', ['**/*.json']);
  labelGlobs.set('myLabel4', ['folder2/myfile.txt']);

  // beforeEach(jest.restoreAllMocks);

  test('payload is not pr', async () => {
    context.payload = {};
    await labelPR(mockGithub(), new Map());
    expect(core.info).not.toBeCalled();
  });

  test('add labels to pr', async () => {
    context.payload = { pull_request: { body: '', number: 1, title: '' } };
    listFiles.mockImplementation(() => ({
      data: [
        { filename: 'file1' },
        { filename: 'file2.md' },
        { filename: 'otherfolder/file3.md' },
        { filename: 'folder1/fake/foo/matchfile.js' },
        { filename: 'folder2/myfile.txt' },
        { filename: 'folder2/myfile2.txt' },
      ],
    }));

    await labelPR(mockGithub(), labelGlobs);

    expect(listFiles).toBeCalledWith({ owner, repo, pull_number: 1 });
    expect(addLabels).toBeCalledWith(
      { owner, repo, issue_number: 1, labels: ['myLabel1', 'myLabel2', 'myLabel4'] },
    );
  });

  test('skip when no labels are found', async () => {
    context.payload = { pull_request: { body: '', number: 1, title: '' } };
    listFiles.mockImplementation(() => ({
      data: [
        { filename: 'filedoesnotmatch' },
      ],
    }));

    await labelPR(mockGithub(), labelGlobs);

    expect(listFiles).toBeCalledWith({ owner, repo, pull_number: 1 });
    expect(addLabels).not.toBeCalled();
  });
});
