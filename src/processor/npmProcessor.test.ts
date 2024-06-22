import { escapeRegExp, NpmProcessor } from './npmProcessor';
import { GitlabClient } from '../gitlab/gitlabClient';

jest.mock('../gitlab/gitlabClient');

describe('NpmProcessor', () => {
  let npmProcessor: NpmProcessor;
  let gitlabClient: GitlabClient;

  beforeEach(() => {
    gitlabClient = new GitlabClient('https://gitlab.example.com', 'mytoken');
    npmProcessor = new NpmProcessor(gitlabClient);
  });

  test('should correctly extract project ids and return project paths', async () => {
    const mockFileContent = JSON.stringify({
      dependencies: {
        packageA: {
          resolved: 'https://gitlab.example.com/api/v4/projects/1/packages',
          dependencies: {
            packageB: { resolved: 'https://gitlab.example.com/api/v4/projects/2/packages' },
          },
        },
        packageC: { resolved: 'https://gitlab.example.com/api/v4/projects/3/packages' },
      },
    });

    const mockGitlabUrl = 'https://gitlab.example.com';

    jest.spyOn(gitlabClient, 'getProject').mockImplementation((projectId) => {
      if (projectId === '1') return Promise.resolve({ path_with_namespace: 'namespaceA/projectA' });
      if (projectId === '2') return Promise.resolve({ path_with_namespace: 'namespaceB/projectB' });
      if (projectId === '3') return Promise.resolve({ path_with_namespace: 'namespaceC/projectC' });
      return Promise.resolve({});
    });

    const result = await npmProcessor.extractDependencies(mockFileContent, mockGitlabUrl);

    expect(result.sort()).toEqual([
      'namespaceA/projectA',
      'namespaceB/projectB',
      'namespaceC/projectC',
    ].sort());

    expect(gitlabClient.getProject).toHaveBeenCalledTimes(3);

    jest.resetAllMocks();
  });

  test('should return an empty array if no dependencies are found', async () => {
    const mockFileContent = JSON.stringify({ dependencies: {} });
    const mockGitlabUrl = 'https://gitlab.example.com';

    const result = await npmProcessor.extractDependencies(mockFileContent, mockGitlabUrl);

    expect(result).toEqual([]);
    expect(gitlabClient.getProject).toHaveBeenCalledTimes(0);

    jest.resetAllMocks();
  });
});

describe('escapeRegExp', () => {
  test('should escape all RegExp special characters', () => {
    const unescaped = '. * + - ? ^ $ { } ( ) | [ ] \\';
    const expected = '\\. \\* \\+ \\- \\? \\^ \\$ \\{ \\} \\( \\) \\| \\[ \\] \\\\';
    expect(escapeRegExp(unescaped)).toEqual(expected);
  });

  test('should leave non-special characters alone', () => {
    const nonSpecialCharacters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    expect(escapeRegExp(nonSpecialCharacters)).toEqual(nonSpecialCharacters);
  });
});
