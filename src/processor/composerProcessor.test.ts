import { ComposerProcessor } from './composerProcessor';

describe('ComposerProcessor', () => {
    const gitlabUrl = 'https://gitlab.example.com';
    const processor = new ComposerProcessor();

    let originalLog: any;

    beforeAll(() => {
        // Suppress console.log and console.error
        originalLog = console.log;
        console.log = jest.fn();
        console.error = jest.fn();
    });

    it('should extract dependencies from repositories section', () => {
        const fileContent = JSON.stringify({
            repositories: {
                'test/test-123': {
                    type: 'vcs',
                    url: 'https://gitlab.example.com/test/test-helm-repository'
                },
                'test/test-155': {
                    type: 'vcs',
                    url: 'https://gitlab.example.com/test/terraform-automation-test'
                },
                'external/repo': {
                    type: 'composer',
                    url: 'https://packagist.example.com'
                }
            }
        });

        const dependencies = processor.extractDependencies(fileContent, gitlabUrl);
        expect(dependencies).toEqual([
            'test/test-helm-repository',
            'test/terraform-automation-test'
        ]);
    });

    it('should handle empty repositories section', () => {
        const fileContent = JSON.stringify({
            repositories: {}
        });

        const dependencies = processor.extractDependencies(fileContent, gitlabUrl);
        expect(dependencies).toEqual([]);
    });

    it('should handle invalid JSON gracefully', () => {
        const fileContent = 'invalid json';

        const consoleErrorMock = jest.spyOn(console, 'error').mockImplementation(() => {});

        const dependencies = processor.extractDependencies(fileContent, gitlabUrl);
        expect(dependencies).toEqual([]);

        consoleErrorMock.mockRestore();
    });
});
