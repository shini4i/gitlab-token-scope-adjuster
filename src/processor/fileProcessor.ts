import path from 'path';

import {GoModProcessor} from './goModProcessor';
import {ComposerProcessor} from './composerProcessor';
import {NpmProcessor} from "./npmProcessor";
import {GitlabClient} from "../gitlab/gitlabClient";

export interface FileProcessor {
    extractDependencies(fileContent: string, gitlabUrl: string): Promise<string[]>;
}

export function createFileProcessor(file: string, gitlabClient: GitlabClient): FileProcessor | undefined {
    const baseName = path.basename(file);
    switch (baseName) {
        case "go.mod":
            return new GoModProcessor();
        case "composer.json":
            return new ComposerProcessor();
        case "package-lock.json":
            return new NpmProcessor(gitlabClient);
        default:
            console.log(`No processor available for file type: ${file}`);
            return undefined;
    }
}
