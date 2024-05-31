import { GitlabClient } from "../gitlab/gitlabClient";
import { processDependencyFile, processAllDependencyFiles, processDependencies } from "./dependencyProcessor";
import { createFileProcessor } from "../processor/fileProcessor";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";

jest.mock("../gitlab/gitlabClient");
jest.mock("../processor/fileProcessor");

describe("dependencyProcessor", () => {
    let mock: MockAdapter;
    let gitlabClient: GitlabClient;

    beforeEach(() => {
        mock = new MockAdapter(axios);
        gitlabClient = new GitlabClient("https://gitlab.example.com", "MyToken");
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
        jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        mock.reset();
        jest.restoreAllMocks();
    });

    describe("processDependencyFile", () => {
        it("should process a dependency file and return dependencies", async () => {
            const projectId = 1;
            const defaultBranch = "master";
            const file = "test.txt";
            const configUrl = "https://config.example.com";
            const fileContent = "file content";
            const dependencies = ["dependency1", "dependency2"];

            mock.onGet(`https://gitlab.example.com/api/v4/projects/${projectId}/repository/files/${encodeURIComponent(file)}/raw?ref=${defaultBranch}`)
                .reply(200, fileContent);

            const processor = {
                extractDependencies: jest.fn().mockReturnValue(dependencies),
            };
            (createFileProcessor as jest.Mock).mockReturnValue(processor);

            const result = await processDependencyFile(gitlabClient, projectId, defaultBranch, file, configUrl);

            expect(result).toEqual(dependencies);
            expect(processor.extractDependencies).toHaveBeenCalledWith(fileContent, configUrl);
        });

        it("should return an empty array if no processor is found", async () => {
            const projectId = 1;
            const defaultBranch = "master";
            const file = "test.txt";
            const configUrl = "https://config.example.com";
            const fileContent = "file content";

            mock.onGet(`https://gitlab.example.com/api/v4/projects/${projectId}/repository/files/${encodeURIComponent(file)}/raw?ref=${defaultBranch}`)
                .reply(200, fileContent);

            (createFileProcessor as jest.Mock).mockReturnValue(null);

            const result = await processDependencyFile(gitlabClient, projectId, defaultBranch, file, configUrl);

            expect(result).toEqual([]);
        });

        it("should log an error and rethrow if an error occurs", async () => {
            const projectId = 1;
            const defaultBranch = "master";
            const file = "test.txt";
            const configUrl = "https://config.example.com";

            mock.onGet(`https://gitlab.example.com/api/v4/projects/${projectId}/repository/files/${encodeURIComponent(file)}/raw?ref=${defaultBranch}`)
                .reply(500);

            await expect(processDependencyFile(gitlabClient, projectId, defaultBranch, file, configUrl)).rejects.toThrow("Request failed with status code 500");
            expect(console.error).toHaveBeenCalledWith(`Failed to process dependency file ${file} for project ID ${projectId}:`, expect.any(Error));
        });
    });

    describe("processAllDependencyFiles", () => {
        it("should process all dependency files and return all dependencies", async () => {
            const projectId = 1;
            const defaultBranch = "master";
            const dependencyFiles = ["file1.txt", "file2.txt"];
            const configUrl = "https://config.example.com";
            const dependencies1 = ["dependency1"];
            const dependencies2 = ["dependency2"];

            (processDependencyFile as jest.Mock).mockImplementation(() => jest.fn())
                .mockResolvedValueOnce(dependencies1)
                .mockResolvedValueOnce(dependencies2);

            const result = await processAllDependencyFiles(gitlabClient, projectId, defaultBranch, dependencyFiles, configUrl);

            expect(result).toEqual([...dependencies1, ...dependencies2]);
        });
    });

    describe("processDependencies", () => {
        it("should process dependencies and grant CI job token access", async () => {
            const dependencies = ["dependency1", "dependency2"];
            const sourceProjectId = 1;
            const dependencyProjectId = 2;

            jest.spyOn(gitlabClient, "getProjectId").mockResolvedValue(dependencyProjectId);
            jest.spyOn(gitlabClient, "isProjectWhitelisted").mockResolvedValue(false);
            jest.spyOn(gitlabClient, "allowCiJobTokenAccess").mockResolvedValue(undefined);

            await processDependencies(gitlabClient, dependencies, sourceProjectId);

            expect(gitlabClient.getProjectId).toHaveBeenCalledWith("dependency1");
            expect(gitlabClient.getProjectId).toHaveBeenCalledWith("dependency2");
            expect(gitlabClient.isProjectWhitelisted).toHaveBeenCalledWith(sourceProjectId, dependencyProjectId.toString());
            expect(gitlabClient.allowCiJobTokenAccess).toHaveBeenCalledWith(dependencyProjectId.toString(), sourceProjectId.toString());
        });

        it("should log an error if granting CI job token access fails", async () => {
            const dependencies = ["dependency1"];
            const sourceProjectId = 1;
            const dependencyProjectId = 2;

            jest.spyOn(gitlabClient, "getProjectId").mockResolvedValue(dependencyProjectId);
            jest.spyOn(gitlabClient, "isProjectWhitelisted").mockResolvedValue(false);
            jest.spyOn(gitlabClient, "allowCiJobTokenAccess").mockRejectedValue(new Error("Failed to grant access"));

            await processDependencies(gitlabClient, dependencies, sourceProjectId);

            expect(gitlabClient.getProjectId).toHaveBeenCalledWith("dependency1");
            expect(gitlabClient.isProjectWhitelisted).toHaveBeenCalledWith(sourceProjectId, dependencyProjectId.toString());
            expect(gitlabClient.allowCiJobTokenAccess).toHaveBeenCalledWith(dependencyProjectId.toString(), sourceProjectId.toString());
        });
    });
});
