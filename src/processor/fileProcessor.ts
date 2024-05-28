export interface FileProcessor {
    extractDependencies(fileContent: string, gitlabUrl: string): string[];
}
