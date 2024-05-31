import {NewClientConfig} from "../config/clientConfig";
import {GitlabClient, NewGitlabClient} from "../gitlab/gitlabClient";

export async function getGitlabClient(): Promise<GitlabClient> {
    const config = NewClientConfig();
    return NewGitlabClient(config.Url!, config.Token!);
}

export async function fetchProjectDetails(gitlabClient: GitlabClient, projectId: number) {
    try {
        const project = await gitlabClient.getProject(projectId.toString());
        console.log("Project name:", project.path_with_namespace);
        console.log("Default branch:", project.default_branch);
        return project;
    } catch (error) {
        console.error(`Failed to fetch project details for project ID ${projectId}:`, error);
        throw error;
    }
}

export async function fetchDependencyFiles(gitlabClient: GitlabClient, projectId: number, defaultBranch: string) {
    try {
        const dependencyFiles = await gitlabClient.findDependencyFiles(projectId.toString(), defaultBranch);
        if (dependencyFiles.length === 0) {
            console.warn(`No dependency files found for project ID ${projectId}`);
            return [];
        }
        console.log("Found the following dependency files:", dependencyFiles);
        return dependencyFiles;
    } catch (error) {
        console.error(`Failed to fetch dependency files for project ID ${projectId}:`, error);
        throw error;
    }
}
