import { GitlabClient } from "../gitlab/gitlabClient";
import { processDependencyFile, processDependencies } from "./dependencyProcessor";
import { createFileProcessor } from "../processor/fileProcessor";

beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
});

jest.mock("../gitlab/gitlabClient");
jest.mock("../processor/fileProcessor");

describe("dependencyProcessor", () => {
    let gitlabClient: jest.Mocked<GitlabClient>;

    beforeEach(() => {
        gitlabClient = new GitlabClient("https://gitlab.example.com", "your_access_token") as jest.Mocked<GitlabClient>;
    });

    describe("processDependencyFile", () => {
        it("should process a dependency file and return dependencies", async () => {
            const fileContent = "file content";
            const dependencies = ["dependency1", "dependency2"];
            const processor = {
                extractDependencies: jest.fn().mockReturnValue(dependencies),
            };

            gitlabClient.getFileContent.mockResolvedValue(fileContent);
            (createFileProcessor as jest.Mock).mockReturnValue(processor);

            const result = await processDependencyFile(gitlabClient, 1, "main", "file.txt", "configUrl");

            expect(gitlabClient.getFileContent).toHaveBeenCalledWith("1", "file.txt", "main");
            expect(processor.extractDependencies).toHaveBeenCalledWith(fileContent, "configUrl");
            expect(result).toEqual(dependencies);
        });

        it("should return an empty array if no processor is found", async () => {
            gitlabClient.getFileContent.mockResolvedValue("file content");
            (createFileProcessor as jest.Mock).mockReturnValue(null);

            const result = await processDependencyFile(gitlabClient, 1, "main", "file.txt", "configUrl");

            expect(result).toEqual([]);
        });

        it("should log an error and rethrow if an error occurs", async () => {
            const error = new Error("Failed to get file content");
            gitlabClient.getFileContent.mockRejectedValue(error);

            await expect(processDependencyFile(gitlabClient, 1, "main", "file.txt", "configUrl")).rejects.toThrow(error);
        });
    });

    describe("processDependencies", () => {
        it("should grant CI job token access for dependencies", async () => {
            const dependencies = ["dependency1", "dependency2"];
            gitlabClient.getProjectId.mockResolvedValue(2);
            gitlabClient.isProjectWhitelisted.mockResolvedValue(false);
            gitlabClient.allowCiJobTokenAccess.mockResolvedValue(undefined);

            await processDependencies(gitlabClient, dependencies, 1);

            expect(gitlabClient.getProjectId).toHaveBeenCalledWith("dependency1");
            expect(gitlabClient.getProjectId).toHaveBeenCalledWith("dependency2");
            expect(gitlabClient.isProjectWhitelisted).toHaveBeenCalledWith(1, "2");
            expect(gitlabClient.allowCiJobTokenAccess).toHaveBeenCalledWith("2", "1");
        });

        it("should skip granting access if the project is already whitelisted", async () => {
            const dependencies = ["dependency1", "dependency2"];
            gitlabClient.getProjectId.mockResolvedValue(2);
            gitlabClient.isProjectWhitelisted.mockResolvedValue(true);

            await processDependencies(gitlabClient, dependencies, 1);

            expect(gitlabClient.getProjectId).toHaveBeenCalledWith("dependency1");
            expect(gitlabClient.getProjectId).toHaveBeenCalledWith("dependency2");
            expect(gitlabClient.isProjectWhitelisted).toHaveBeenCalledWith(1, "2");
            expect(gitlabClient.allowCiJobTokenAccess).not.toHaveBeenCalled();
        });
    });
});
