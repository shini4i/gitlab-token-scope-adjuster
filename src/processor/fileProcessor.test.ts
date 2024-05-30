import { createFileProcessor } from './fileProcessor';
import { GoModProcessor } from './goModProcessor';
import { ComposerProcessor } from './composerProcessor';

describe('createFileProcessor', () => {
    it('should return an instance of GoModProcessor for go.mod files', () => {
        const processor = createFileProcessor('go.mod');
        expect(processor).toBeInstanceOf(GoModProcessor);
    });

    it('should return an instance of ComposerProcessor for composer.json files', () => {
        const processor = createFileProcessor('composer.json');
        expect(processor).toBeInstanceOf(ComposerProcessor);
    });

    it('should return undefined for unsupported file types', () => {
        const processor = createFileProcessor('unsupported.file');
        expect(processor).toBeUndefined();
    });

    it('should log a message for unsupported file types', () => {
        const consoleSpy = jest.spyOn(console, 'log');
        createFileProcessor('unsupported.file');
        expect(consoleSpy).toHaveBeenCalledWith('No processor available for file type: unsupported.file');
        consoleSpy.mockRestore();
    });
});
