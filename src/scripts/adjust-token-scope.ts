import { fetchDependencyFiles, fetchProjectDetails, getGitlabClient } from '../utils/gitlabHelpers';
import { processAllDependencyFiles, processDependencies } from '../utils/dependencyProcessor';

export async function adjustTokenScope(projectId: number, dryRun: boolean, monorepo: boolean) {
  const gitlabClient = await getGitlabClient();
  const project = await fetchProjectDetails(gitlabClient, projectId);
  let dependencyFiles = await fetchDependencyFiles(gitlabClient, projectId, project.default_branch, monorepo);

  if (!dependencyFiles) {
    dependencyFiles = [];
  }

  const allDependencies = await processAllDependencyFiles(gitlabClient, projectId, project.default_branch, dependencyFiles);

  if (allDependencies && allDependencies.length > 0) {
    if (dryRun) {
      console.log('Dry run mode: CI_JOB_TOKEN would be whitelisted in the following projects:');
      allDependencies.forEach(dependency => console.log(`- ${dependency}`));
    } else {
      await processDependencies(gitlabClient, allDependencies, projectId);
    }
  } else {
    console.error('No dependencies found to process.');
  }
}
