import {FileProcessor} from './fileProcessor';
import {GitlabClient} from '../gitlab/gitlabClient';

interface PackageLock {
    dependencies: Record<string, Dependency>;
}

interface Dependency {
    version: string;
    resolved: string;
    integrity: string;
    peer?: boolean;
    dependencies?: Record<string, Dependency>;
}

export class NpmProcessor implements FileProcessor {
    private gitlabClient: GitlabClient;

    constructor(gitlabClient: GitlabClient) {
        this.gitlabClient = gitlabClient;
    }

    async extractDependencies(fileContent: string, gitlabUrl: string): Promise<string[]> {
        const packageLock: PackageLock = JSON.parse(fileContent);
        const projectIds = new Set<string>();
        const stack = [packageLock.dependencies];

        while (stack.length > 0) {
            const deps = stack.pop();
            if (!deps) continue;

            for (const details of Object.values(deps)) {
                await this.processDependency(details, gitlabUrl, projectIds, stack);
            }
        }

        return Array.from(projectIds);
    }

    private async processDependency(
        details: Dependency,
        gitlabUrl: string,
        projectIds: Set<string>,
        stack: Record<string, Dependency>[]
    ) {
        if (details.resolved) {
            const projectId = this.extractProjectId(details.resolved, gitlabUrl);
            if (projectId) {
                await this.addProjectId(projectId, projectIds);
            }
            if (details.dependencies) {
                stack.push(details.dependencies);
            }
        }
    }

    private async addProjectId(projectId: string, projectIds: Set<string>) {
        try {
            const project = await this.gitlabClient.getProject(projectId);
            if (project.path_with_namespace) {
                projectIds.add(project.path_with_namespace);
            }
        } catch (error) {
            console.error(`Error fetching project ${projectId}:`, error);
        }
    }

    private extractProjectId(resolvedUrl: string, gitlabUrl: string): string | null {
        const escapedGitlabUrl = escapeRegExp(gitlabUrl);
        const regex = new RegExp(`${escapedGitlabUrl}/api/v4/projects/(\\d+)/packages`);
        const match = regex.exec(resolvedUrl);
        return match ? match[1] : null;
    }
}

export function escapeRegExp(string: string): string {
    return string.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&');
}
