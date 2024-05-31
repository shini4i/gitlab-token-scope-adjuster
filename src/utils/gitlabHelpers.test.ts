import { GitlabClient, NewGitlabClient } from "../gitlab/gitlabClient";
import { getGitlabClient, fetchProjectDetails, fetchDependencyFiles } from "./gitlabHelpers";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";

jest.mock("../gitlab/gitlabClient", () => {
    return {
        GitlabClient: jest.fn().mockImplementation((url, token) => {
            return {
                getProject: jest.fn().mockImplementation((projectId) => {
                    if (projectId === 1) {
                        return Promise.resolve({
                            path_with_namespace: "namespace/project",
                            default_branch: "master",
                        });
                    } else {
                        return Promise.reject(new Error("Request failed with status code 500"));
                    }
                }),
                findDependencyFiles: jest.fn().mockImplementation((projectId, branch) => {
                    if (projectId === 1 && branch === "master") {
                        return Promise.resolve(["file1.txt", "file2.txt"]);
                    } else if (projectId === 1 && branch === "empty") {
                        return Promise.resolve([]);
                    } else {
                        return Promise.reject(new Error("Request failed with status code 500"));
                    }
                }),
            };
        }),
        NewGitlabClient: jest.fn().mockImplementation((url, token) => {
            return {
                getProject: jest.fn().mockImplementation((projectId) => {
                    if (projectId === 1) {
                        return Promise.resolve({
                            path_with_namespace: "namespace/project",
                            default_branch: "master",
                        });
                    } else {
                        return Promise.reject(new Error("Request failed with status code 500"));
                    }
                }),
                findDependencyFiles: jest.fn().mockImplementation((projectId, branch) => {
                    if (projectId === 1 && branch === "master") {
                        return Promise.resolve(["file1.txt", "file2.txt"]);
                    } else if (projectId === 1 && branch === "empty") {
                        return Promise.resolve([]);
                    } else {
                        return Promise.reject(new Error("Request failed with status code 500"));
                    }
                }),
            };
        }),
    };
});

describe("gitlabHelpers", () => {
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

    describe("getGitlabClient", () => {
        it("should create and return a new GitLab client", async () => {
            const client = await getGitlabClient();
            expect(client.getProject).toBeDefined();
            expect(client.findDependencyFiles).toBeDefined();
        });
    });

    describe("fetchProjectDetails", () => {
        it("should fetch and return project details", async () => {
            const projectId = 1;
            const project = {
                path_with_namespace: "namespace/project",
                default_branch: "master",
            };

            mock.onGet(`https://gitlab.example.com/api/v4/projects/${projectId}`).reply(200, project);

            const result = await fetchProjectDetails(gitlabClient, projectId);

            expect(result).toEqual(project);
            expect(console.log).toHaveBeenCalledWith("Project name:", project.path_with_namespace);
            expect(console.log).toHaveBeenCalledWith("Default branch:", project.default_branch);
        });

        it("should log an error and rethrow if an error occurs", async () => {
            const projectId = 1;

            mock.onGet(`https://gitlab.example.com/api/v4/projects/${projectId}`).reply(500);

            await expect(fetchProjectDetails(gitlabClient, projectId)).rejects.toThrow("Request failed with status code 500");
            expect(console.error).toHaveBeenCalledWith(`Failed to fetch project details for project ID ${projectId}:`, expect.any(Error));
        });
    });

    describe("fetchDependencyFiles", () => {
        it("should fetch and return dependency files", async () => {
            const projectId = 1;
            const defaultBranch = "master";
            const dependencyFiles = ["file1.txt", "file2.txt"];

            mock.onGet(`https://gitlab.example.com/api/v4/projects/${projectId}/repository/tree?ref=${defaultBranch}`).reply(200, dependencyFiles);

            const result = await fetchDependencyFiles(gitlabClient, projectId, defaultBranch);

            expect(result).toEqual(dependencyFiles);
            expect(console.log).toHaveBeenCalledWith("Found the following dependency files:", dependencyFiles);
        });

        it("should return an empty array if no dependency files are found", async () => {
            const projectId = 1;
            const defaultBranch = "master";

            mock.onGet(`https://gitlab.example.com/api/v4/projects/${projectId}/repository/tree?ref=${defaultBranch}`).reply(200, []);

            const result = await fetchDependencyFiles(gitlabClient, projectId, defaultBranch);

            expect(result).toEqual([]);
            expect(console.warn).toHaveBeenCalledWith(`No dependency files found for project ID ${projectId}`);
        });

        it("should log an error and rethrow if an error occurs", async () => {
            const projectId = 1;
            const defaultBranch = "master";

            mock.onGet(`https://gitlab.example.com/api/v4/projects/${projectId}/repository/tree?ref=${defaultBranch}`).reply(500);

            await expect(fetchDependencyFiles(gitlabClient, projectId, defaultBranch)).rejects.toThrow("Request failed with status code 500");
            expect(console.error).toHaveBeenCalledWith(`Failed to fetch dependency files for project ID ${projectId}:`, expect.any(Error));
        });
    });
});
