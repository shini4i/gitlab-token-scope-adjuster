import { GoModProcessor } from './goModProcessor';

describe('GoModProcessor', () => {
  let goModProcessor: GoModProcessor;

  beforeEach(() => {
    goModProcessor = new GoModProcessor();
  });

  test('should correctly extract dependencies', async () => {
    const goModFileContent = `
module test-package

go 1.22

toolchain go1.22.2

require (
    github.com/some/repo v1.2.3
    gitlab.example.com/my/repo v4.6.7
    gitlab.example.com/another/repo v0.0.1
)
`;
    const gitlabUrl = 'https://gitlab.example.com';
    const result = await goModProcessor.extractDependencies(goModFileContent, gitlabUrl);

    expect(result).toEqual([
      'my/repo',
      'another/repo',
    ]);
  });
});
