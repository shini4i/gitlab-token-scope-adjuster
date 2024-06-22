import { createFileProcessor } from './fileProcessor';
import { GoModProcessor } from './goModProcessor';
import { ComposerProcessor } from './composerProcessor';
import { GitlabClient } from '../gitlab/gitlabClient';
import { NpmProcessor } from './npmProcessor';

const gitlabClient = new GitlabClient('https://gitlab.example.com', 'mytoken');

beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {
  });
  jest.spyOn(console, 'log').mockImplementation(() => {
  });
});

describe('createFileProcessor', () => {
  it('should return an instance of GoModProcessor for go.mod files', () => {
    const processor = createFileProcessor('go.mod', gitlabClient);
    expect(processor).toBeInstanceOf(GoModProcessor);
  });

  it('should return an instance of ComposerProcessor for composer.json files', () => {
    const processor = createFileProcessor('composer.json', gitlabClient);
    expect(processor).toBeInstanceOf(ComposerProcessor);
  });

  it('should return undefined for unsupported file types', () => {
    const processor = createFileProcessor('unsupported.file', gitlabClient);
    expect(processor).toBeUndefined();
  });

  it('should return an instance of NpmProcessor for package-lock.json files', () => {
    const processor = createFileProcessor('package-lock.json', gitlabClient);
    expect(processor).toBeInstanceOf(NpmProcessor);
  });

  it('should log a message for unsupported file types', () => {
    const consoleSpy = jest.spyOn(console, 'log');
    createFileProcessor('unsupported.file', gitlabClient);
    expect(consoleSpy).toHaveBeenCalledWith('No processor available for file type: unsupported.file');
    consoleSpy.mockRestore();
  });
});
