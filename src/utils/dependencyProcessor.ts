import {GitlabClient} from "../gitlab/gitlabClient";
import {createFileProcessor} from "../processor/fileProcessor";

export async function processDependencyFile(gitlabClient: GitlabClient, projectId: number, defaultBranch: string, file: string, configUrl: string): Promise<string[]> {
    try {
        const fileContent = await gitlabClient.getFileContent(projectId.toString(), file, defaultBranch);
        const processor = createFileProcessor(file);

        if (!processor) {
            return [];
        }

        const dependencies = processor.extractDependencies(fileContent, configUrl);

        console.log(`Dependencies from ${file} that match the GitLab URL: `, dependencies);
        return dependencies;
    } catch (error) {
        console.error(`Failed to process dependency file ${file} for project ID ${projectId}:`, error);
        throw error;
    }
}

export async function processAllDependencyFiles(gitlabClient: GitlabClient, projectId: number, defaultBranch: string, dependencyFiles: string[], configUrl: string): Promise<string[]> {
    const allDependencies: string[] = [];

    for (const file of dependencyFiles) {
        const dependencies = await processDependencyFile(gitlabClient, projectId, defaultBranch, file, configUrl);
        allDependencies.push(...dependencies);
    }

    return allDependencies;
}

export async function processDependencies(gitlabClient: GitlabClient, dependencies: string[], sourceProjectId: number) {
    const tasks = dependencies.map(async (dependency: string) => {
        try {
            const dependencyProjectId = await gitlabClient.getProjectId(dependency);
            if (!await gitlabClient.isProjectWhitelisted(sourceProjectId, dependencyProjectId.toString())) {
                await gitlabClient.allowCiJobTokenAccess(dependencyProjectId.toString(), sourceProjectId.toString());
                console.log(`===> Project was whitelisted in ${dependency} successfully`);
            } else {
                console.log(`===> Project is already whitelisted in ${dependency}, skipping...`);
            }
        } catch (err) {
            console.log(`Failed to grant token scope from project ${dependency} to source project: ${err}`);
        }
    });
    await Promise.all(tasks);
}
