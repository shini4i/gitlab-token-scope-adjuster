import {GitlabClient} from "../gitlab/gitlabClient";
import {createFileProcessor} from "../processor/fileProcessor";

/**
 * Processes a single dependency file and returns the extracted dependencies.
 *
 * @param gitlabClient - The GitLab client instance.
 * @param projectId - The ID of the project.
 * @param defaultBranch - The default branch of the project.
 * @param file - The path to the dependency file.
 * @param configUrl - The configuration URL.
 * @returns A promise that resolves to an array of extracted dependencies.
 */
export async function processDependencyFile(gitlabClient: GitlabClient, projectId: string, defaultBranch: string, file: string, configUrl: string): Promise<string[]> {
    try {
        const fileContent = await gitlabClient.getFileContent(projectId, file, defaultBranch);
        const processor = createFileProcessor(file, gitlabClient);

        if (!processor) {
            return [];
        }

        const dependencies = await processor.extractDependencies(fileContent, configUrl);

        console.log(`Dependencies from \x1b[36m${file}\x1b[0m that match the GitLab URL: `, dependencies);
        return dependencies;
    } catch (error) {
        console.error(`Failed to process dependency file ${file} for project ID ${projectId}:`, error);
        throw error;
    }
}

/**
 * Processes all dependency files and returns the aggregated dependencies.
 *
 * @param gitlabClient - The GitLab client instance.
 * @param projectId - The ID of the project.
 * @param defaultBranch - The default branch of the project.
 * @param dependencyFiles - An array of paths to the dependency files.
 * @param configUrl - The configuration URL.
 * @returns A promise that resolves to an array of aggregated dependencies.
 */
export async function processAllDependencyFiles(gitlabClient: GitlabClient, projectId: string, defaultBranch: string, dependencyFiles: string[], configUrl: string): Promise<string[]> {
    const allDependencies: string[] = [];

    for (const file of dependencyFiles) {
        try {
            const dependencies = await processDependencyFile(gitlabClient, projectId, defaultBranch, file, configUrl);
            allDependencies.push(...dependencies);
        } catch (error) {
            console.error(`Error processing file ${file}:`, error);
            // Continue processing the remaining files
        }
    }

    return allDependencies;
}

/**
 * Processes the dependencies and grants CI job token access for each dependency project.
 *
 * @param gitlabClient - The GitLab client instance.
 * @param dependencies - An array of dependency project names.
 * @param sourceProjectId - The ID of the source project.
 * @returns A promise that resolves when all tasks are completed.
 */
export async function processDependencies(gitlabClient: GitlabClient, dependencies: string[], sourceProjectId: number) {
    const tasks = dependencies.map(async (dependency: string) => {
        try {
            const dependencyProjectId = await gitlabClient.getProjectId(dependency);
            if (!await gitlabClient.isProjectWhitelisted(sourceProjectId, dependencyProjectId)) {
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
