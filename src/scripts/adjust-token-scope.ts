#!/usr/bin/env node

import { Command } from 'commander';
import { NewClientConfig } from "../config/clientConfig";
import { GitlabClient, NewGitlabClient } from "../gitlab/gitlabClient";
import { createFileProcessor } from "../processor/fileProcessor";

const program = new Command();

program
    .version('0.1.0')
    .description('CLI tool for whitelisting CI_JOB_TOKEN in dependencies projects')
    .requiredOption('-p, --project-id <id>', 'The project ID')
    .action(async ({ projectId }) => {
        try {
            const parsedProjectId = parseInt(projectId, 10);
            if (isNaN(parsedProjectId)) {
                console.error('Invalid project ID');
                process.exit(1);
            }
            await adjustTokenScope(parsedProjectId);
            console.log("Finished adjusting token scope!");
        } catch (error) {
            console.error("Failed to adjust token scope:", error);
            process.exit(1);
        }
    });

async function getGitlabClient(): Promise<GitlabClient> {
    const config = NewClientConfig();
    return NewGitlabClient(config.Url!, config.Token!);
}

async function fetchProjectDetails(gitlabClient: GitlabClient, projectId: number) {
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

async function fetchDependencyFiles(gitlabClient: GitlabClient, projectId: number, defaultBranch: string) {
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

async function processDependencyFile(gitlabClient: GitlabClient, projectId: number, defaultBranch: string, file: string, configUrl: string): Promise<string[]> {
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

async function processAllDependencyFiles(gitlabClient: GitlabClient, projectId: number, defaultBranch: string, dependencyFiles: string[], configUrl: string): Promise<string[]> {
    const allDependencies: string[] = [];

    for (const file of dependencyFiles) {
        const dependencies = await processDependencyFile(gitlabClient, projectId, defaultBranch, file, configUrl);
        allDependencies.push(...dependencies);
    }

    return allDependencies;
}

async function processDependencies(gitlabClient: GitlabClient, dependencies: string[], sourceProjectId: number) {
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

async function adjustTokenScope(projectId: number) {
    const config = NewClientConfig();
    const gitlabClient = await getGitlabClient();
    const project = await fetchProjectDetails(gitlabClient, projectId);
    const dependencyFiles = await fetchDependencyFiles(gitlabClient, projectId, project.default_branch);

    const allDependencies = await processAllDependencyFiles(gitlabClient, projectId, project.default_branch, dependencyFiles, config.Url!);
    await processDependencies(gitlabClient, allDependencies, projectId);
}

program.parse(process.argv);
