import * as core from '@actions/core';
import { context } from '@actions/github';

import { checkCommits, checkPR } from '@minddocdev/mou-pr-action/lib/style';

jest.mock('@actions/github', () => ({
  context: {
    repo: {
      owner: 'myorg',
      repo: 'myrepo',
    },
    payload: {
      pull_request: {},
    },
  }
}));
jest.mock('@actions/core');

describe('style', () => {
  describe('check pr', () => {
    test('payload is not pr', () => {
      context.payload = {};
      checkPR(undefined, undefined);
      expect(core.info).not.toBeCalled();
    });

    test('with correct body regex', () => {
      context.payload = { pull_request: { body: 'This is my PR body', number: 1, title: '' } };
      checkPR('.*', undefined, undefined);
      expect(core.info).toBeCalled();
    });

    test('with incorrect body regex', () => {
      const body = 'This is my PR body';
      const regex = '\\[(CHORE|HOTFIX)\\] [A-Za-z0-9]+';
      context.payload = { pull_request: { body, number: 1, title: '' } };
      expect(() => checkPR(regex, undefined, undefined)).toThrowError(
        `PR body "${body}" does not match regex "${regex}"`,
      );
      expect(core.info).not.toBeCalled();
    });

    test('with correct title regex', () => {
      context.payload = { pull_request: { body: '', number: 1, title: '[JIRA-123] PR Title' } };
      checkPR(undefined, '50', '\\[JIRA-[0-9]+\\] [A-Za-z0-9]+');
      expect(core.info).toBeCalled();
    });

    test('with incorrect title regex', () => {
      const title = 'This is my PR title';
      const regex = '\\[(CHORE|HOTFIX)\\] [A-Za-z0-9]+';
      context.payload = { pull_request: { title, number: 1, body: '' } };
      expect(() => checkPR(undefined, undefined, regex)).toThrowError(
        `PR title "${title}" does not match regex "${regex}"`,
      );
      expect(core.info).not.toBeCalled();
    });

    test('with incorrect title length', () => {
      const maxLength = '4';
      const title = '[JIRA-123] PR Title';
      context.payload = { pull_request: { title, body: '', number: 1 } };
      expect(() => checkPR(undefined, maxLength, undefined)).toThrowError(
        `PR title "${title}" exceeds "${maxLength}" character length`,
      );
      expect(core.info).not.toBeCalled();
    });
  });

  describe('check commits', () => {
    test('payload is not commit', () => {
      context.payload = {};
      checkCommits(false, undefined, undefined);
      expect(core.info).not.toBeCalled();
    });

    test('with correct title length', () => {
      context.payload = { commits: [{ message: '' }] };
      checkCommits(false, '72', undefined);
      expect(core.info).toBeCalled();
    });

    test('with incorrect title length', () => {
      const message = 'Longer than 4 characters';;
      const length = '4';
      context.payload = { commits: [{ message }] };
      expect(() => checkCommits(false, length, undefined)).toThrowError(
        `Commit title "${message}" exceeds "${length}" character length`,
      );
      expect(core.info).not.toBeCalled();
    });

    test('with correct title regex', () => {
      context.payload = { commits: [{ message: '[CHORE] Commit title' }] };
      checkCommits(false, undefined, '\\[(CHORE|HOTFIX)\\] [A-Za-z0-9]+');
      expect(core.info).toBeCalled();
    });

    test('with incorrect title regex', () => {
      const message = 'Commit that does not match regex';
      const regex = '\\[(CHORE|HOTFIX)\\] [A-Za-z0-9]+';
      context.payload = { commits: [{ message }] };
      expect(() => checkCommits(false, undefined, regex)).toThrowError(
        `Commit title "${message}" does not match regex "${regex}"`,
      );
      expect(core.info).not.toBeCalled();
    });

    test('validate conventional commits', () => {
      context.payload = {
        commits: [
          { message: 'fix(compile): something' },
          { message: 'feat(location): something' },
          { message: 'docs(filter): something' },
          { message: 'style(http): something' },
          { message: 'refactor(httpBackend): something' },
          { message: 'test(resource): something' },
          { message: 'chore(controller): something' },
          { message: 'chore($foo-bar): something' },
          { message: 'chore(*): something' },
          { message: 'chore(guide/location): something' },
          { message: 'revert(foo): something' },
          { message: 'fix: blablabla' },
          { message: 'chore(mocks.$httpBackend): something' },
          { message: 'fix($compile)!: something' },
        ],
      };
      checkCommits(true, undefined, undefined);
      expect(core.info).toBeCalled();
    });

    test('invalidate commit with wrong format', () => {
      [
        'fix(): something',
        'fix; something',
        'Just a normal commit',
      ].forEach(message => {
        context.payload = {
          commits: [{ message }],
        };
        expect(() => checkCommits(true, undefined, undefined)).toThrowError(
          `Commit message "${message}" does not match "<type>(<scope>): <subject>"`,
        );
        expect(core.info).not.toBeCalled();
      });
    });

    test('commits are github squash without requiring PR title regex', () => {
      context.payload = {
        commits: [
          {
            message:
              'feat(auth): implement login mechanism (#1716)\n\n' +
              '* feat(auth): set login endpoint controller\n\n' +
              '* test(auth): add integration test for login endpoint #MAJOR\n\n' +
              '* fix(auth): set secure and http only options\n\n' +
              '* perf(auth): add additional fake performance\n\n' +
              'This is the body of the previous commit\n\n' +
              'And this is the footer\n\n' +
              '* config(auth): Set values for staging and production\n\n' +
              'This is the body of the previous commit\n\n' +
              '* feat(auth): set cookie expiration to the amount of time of the token\n\n' +
              '* fix(auth): remove joi validation since it does not accept localhost',
          },
        ],
      };
      checkCommits(true, '72', undefined);
      expect(core.info).toBeCalled();
    });
  });

  // describe('check squash commits', () => {
  //   test('payload is not commit', () => {
  //     context.payload = {};
  //     checkSquashCommits(false, undefined, undefined, undefined, undefined);
  //     expect(core.info).not.toBeCalled();
  //   });

  //   test('commits are no github squash', () => {
  //     const message = '[HOTFIX] Fix auth\n\n* feat(auth): set new invite mechanism\n';
  //     context.payload = {
  //       commits: [{ message }],
  //     };
  //     expect(() =>
  //       checkSquashCommits(false, undefined, undefined, undefined, undefined),
  //     ).toThrowError(`Commit "${message}" does not seem to be a Github squash.`);
  //     expect(core.info).not.toBeCalled();
  //   });

  //   test('commits are github squash that match PR title regex', () => {
  //     context.payload = {
  //       commits: [
  //         {
  //           message:
  //             '[HOTFIX] Fix auth (#1888)\n\n' +
  //             '* feat(auth): set new invite mechanism\n\n' +
  //             '* fix(auth): remove otp assignation\n',
  //         },
  //         {
  //           message:
  //             '[CHORE] Add renovate (#1889)\n' +
  //             '* chore: set renovate config\n' +
  //             '* ci: add renovate\n',
  //         },
  //         {
  //           message:
  //             '[HOTFIX] Fix CI pipeline (#1889)\n' +
  //             '* ci(auth): add integration test step\n' +
  //             '* ci: set triggers to all workflows',
  //         },
  //       ],
  //     };
  //     checkSquashCommits(true, '72', undefined, undefined, '\\[(CHORE|HOTFIX)\\] [A-Za-z0-9]+');
  //     expect(core.info).toBeCalled();
  //   });
  // });
});
