import {fetchDependencyFiles, fetchProjectDetails, getGitlabClient} from "../utils/gitlabHelpers";
import {processAllDependencyFiles, processDependencies} from "../utils/dependencyProcessor";
import {NewClientConfig} from "../config/clientConfig";

export async function adjustTokenScope(projectId: number) {
    const config = NewClientConfig();
    const gitlabClient = await getGitlabClient();
    const project = await fetchProjectDetails(gitlabClient, projectId);
    const dependencyFiles = await fetchDependencyFiles(gitlabClient, projectId, project.default_branch);

    const allDependencies = await processAllDependencyFiles(gitlabClient, projectId, project.default_branch, dependencyFiles, config.Url!);
    await processDependencies(gitlabClient, allDependencies, projectId);
}
