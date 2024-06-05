import { FileProcessor } from './fileProcessor';
import { GitlabClient } from '../gitlab/gitlabClient';

export class NpmProcessor implements FileProcessor {
    private gitlabClient: GitlabClient;

    constructor(gitlabClient: GitlabClient) {
        this.gitlabClient = gitlabClient;
    }

    async extractDependencies(fileContent: string, gitlabUrl: string): Promise<string[]> {
        const packageLock = JSON.parse(fileContent);
        const projectIds = new Set<string>();

        const extractProjectIds = async (deps: Record<string, any>) => {
            for (const details of Object.values(deps)) {
                if (typeof details === 'object' && details !== null && details.resolved) {
                    const projectId = this.extractProjectId(details.resolved, gitlabUrl);
                    if (projectId) {
                        const project = await this.gitlabClient.getProject(projectId);
                        if(project.path_with_namespace) {
                            projectIds.add(project.path_with_namespace);
                        }
                    }
                    if (details.dependencies) {
                        await extractProjectIds(details.dependencies);
                    }
                }
            }
        };

        await extractProjectIds(packageLock.dependencies);
        return Array.from(projectIds);
    }

    private extractProjectId(resolvedUrl: string, gitlabUrl: string): string | null {
        const escapedGitlabUrl = gitlabUrl.replace(/\./g, '\\.');
        const regex = new RegExp(`${escapedGitlabUrl}/api/v4/projects/(\\d+)/packages`);
        const match = regex.exec(resolvedUrl);
        return match ? match[1] : null;
    }
}
