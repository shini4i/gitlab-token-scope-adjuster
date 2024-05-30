import { GoModProcessor } from './goModProcessor';
import { ComposerProcessor } from './composerProcessor';

export interface FileProcessor {
    extractDependencies(fileContent: string, gitlabUrl: string): string[];
}

export function createFileProcessor(file: string): FileProcessor | undefined {
    switch (file) {
        case "go.mod":
            return new GoModProcessor();
        case "composer.json":
            return new ComposerProcessor();
        default:
            console.log(`No processor available for file type: ${file}`);
            return undefined;
    }
}
