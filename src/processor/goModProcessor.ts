import {FileProcessor} from './fileProcessor';

export class GoModProcessor implements FileProcessor {
    extractDependencies(fileContent: string, gitlabUrl: string): string[] {
        const lines = fileContent.split('\n');
        const strippedUrl = gitlabUrl.replace('https://', '');

        let isRequireBlock = false;
        const dependencies = [];
        for (const line of lines) {
            if (line.startsWith('require (')) {
                isRequireBlock = true;
                continue;
            }
            if (line.startsWith(')')) {
                isRequireBlock = false;
                continue;
            }
            if (isRequireBlock) {
                const dep = line.trim().split(' ')[0];
                if (dep.includes(strippedUrl)) {
                    const formattedDep = dep.replace(strippedUrl + '/', '');
                    dependencies.push(formattedDep);
                }
            }
        }

        // we are returning only path_with_namespace part of dependencies here
        return dependencies;
    }
}
