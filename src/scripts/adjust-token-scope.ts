import {fetchDependencyFiles, fetchProjectDetails, getGitlabClient} from "../utils/gitlabHelpers";
import {processAllDependencyFiles, processDependencies} from "../utils/dependencyProcessor";
import {NewClientConfig} from "../config/clientConfig";

export async function adjustTokenScope(projectId: number, dryRun: boolean, monorepo: boolean) {
    const config = NewClientConfig();
    const gitlabClient = await getGitlabClient();
    const project = await fetchProjectDetails(gitlabClient, projectId);
    let dependencyFiles = await fetchDependencyFiles(gitlabClient, projectId, project.default_branch, monorepo);

    if (!dependencyFiles) {
        dependencyFiles = [];
    }

    const allDependencies = await processAllDependencyFiles(gitlabClient, projectId.toString(), project.default_branch, dependencyFiles, config.Url!);

    if (allDependencies && allDependencies.length > 0) {
        if (dryRun) {
            console.log("Dry run mode: CI_JOB_TOKEN would be whitelisted in the following projects:");
            allDependencies.forEach(dependency => console.log(`- ${dependency}`));
        } else {
            await processDependencies(gitlabClient, allDependencies, projectId);
        }
    } else {
        console.error('No dependencies found to process.');
    }
}
