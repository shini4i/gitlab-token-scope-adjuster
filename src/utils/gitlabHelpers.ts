import { NewClientConfig } from "../config/clientConfig";
import { GitlabClient, NewGitlabClient } from "../gitlab/gitlabClient";

/**
 * Creates the GitLab client configuration.
 * @returns {Object} An object containing the URL and token for the GitLab client.
 */
function createGitlabClientConfig(): { url: string; token: string } {
    const config = NewClientConfig();
    return { url: config.Url!, token: config.Token! };
}

/**
 * Creates a new GitLab client instance.
 * @returns {Promise<GitlabClient>} A promise that resolves to a GitLab client instance.
 */
export async function getGitlabClient(): Promise<GitlabClient> {
    const { url, token } = createGitlabClientConfig();
    return NewGitlabClient(url, token);
}

/**
 * Logs the details of a project.
 * @param {Object} project - The project object containing details to log.
 * @returns {Promise<void>} A promise that resolves when the logging is complete.
 */
async function logProjectDetails(project: any): Promise<void> {
    console.log("Project name:", project.path_with_namespace);
    console.log("Default branch:", project.default_branch);
}

/**
 * Handles errors that occur during fetch operations.
 * @param {Error} error - The error object.
 * @param {number} projectId - The ID of the project for which the error occurred.
 * @param {string} context - The context in which the error occurred.
 * @returns {Promise<void>} A promise that resolves when the error handling is complete.
 */
async function handleFetchError(error: any, projectId: number, context: string): Promise<void> {
    console.error(`Failed to ${context} for project ID ${projectId}:`, error);
    throw error;
}

/**
 * Fetches the details of a project.
 * @param {GitlabClient} gitlabClient - The GitLab client instance.
 * @param {number} projectId - The ID of the project to fetch details for.
 * @returns {Promise<Object>} A promise that resolves to the project details.
 */
export async function fetchProjectDetails(gitlabClient: GitlabClient, projectId: number) {
    try {
        const project = await gitlabClient.getProject(projectId.toString());
        await logProjectDetails(project);
        return project;
    } catch (error) {
        await handleFetchError(error, projectId, "fetch project details");
    }
}

/**
 * Logs the list of dependency files.
 * @param {string[]} dependencyFiles - The list of dependency files to log.
 * @returns {Promise<void>} A promise that resolves when the logging is complete.
 */
async function logDependencyFiles(dependencyFiles: string[]): Promise<void> {
    if (dependencyFiles.length === 0) {
        console.warn("No dependency files found");
    } else {
        console.log("Found the following dependency files:", dependencyFiles);
    }
}

/**
 * Fetches the dependency files for a project.
 * @param {GitlabClient} gitlabClient - The GitLab client instance.
 * @param {number} projectId - The ID of the project to fetch dependency files for.
 * @param {string} defaultBranch - The default branch of the project.
 * @returns {Promise<string[]>} A promise that resolves to the list of dependency files.
 */
export async function fetchDependencyFiles(gitlabClient: GitlabClient, projectId: number, defaultBranch: string) {
    try {
        const dependencyFiles = await gitlabClient.findDependencyFiles(projectId.toString(), defaultBranch);
        await logDependencyFiles(dependencyFiles);
        return dependencyFiles;
    } catch (error) {
        await handleFetchError(error, projectId, "fetch dependency files");
    }
}
