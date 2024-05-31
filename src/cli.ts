#!/usr/bin/env node

import {Command} from 'commander';
import {adjustTokenScope} from './scripts/adjust-token-scope';

const program = new Command();

program
    .version('0.1.1')
    .description('CLI tool for whitelisting CI_JOB_TOKEN in dependencies projects');

program
    .option('-p, --project-id <id>', 'The project ID')
    .action(async (options) => {
        const {projectId} = options;
        if (!projectId) {
            program.outputHelp();
            process.exit(1);
        }
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

program.parse(process.argv);
