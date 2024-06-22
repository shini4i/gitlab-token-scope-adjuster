import { fetchDependencyFiles, fetchProjectDetails } from './gitlabHelpers';
import { GitlabClient } from '../gitlab/gitlabClient';

beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {
  });
  jest.spyOn(console, 'warn').mockImplementation(() => {
  });
  jest.spyOn(console, 'log').mockImplementation(() => {
  });
});

jest.mock('../gitlab/gitlabClient');

describe('gitlabHelpers', () => {
  let mockGitlabClient: jest.Mocked<GitlabClient>;

  beforeEach(() => {
    mockGitlabClient = new GitlabClient('https://gitlab.example.com', 'test-token') as jest.Mocked<GitlabClient>;
    (GitlabClient as jest.Mock).mockReturnValue(mockGitlabClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchProjectDetails', () => {
    it('should fetch project details successfully', async () => {
      const projectId = 1;
      const projectDetails = {
        path_with_namespace: 'namespace/project',
        default_branch: 'main',
      };
      mockGitlabClient.getProject.mockResolvedValue(projectDetails);

      const result = await fetchProjectDetails(mockGitlabClient, projectId);
      expect(result).toEqual(projectDetails);
      expect(mockGitlabClient.getProject).toHaveBeenCalledWith(projectId.toString());
    });

    it('should log an error and rethrow if fetching project details fails', async () => {
      const projectId = 1;
      const error = new Error('Failed to fetch project details');
      mockGitlabClient.getProject.mockRejectedValue(error);

      await expect(fetchProjectDetails(mockGitlabClient, projectId)).rejects.toThrow(error);
      expect(mockGitlabClient.getProject).toHaveBeenCalledWith(projectId.toString());
    });
  });

  describe('fetchDependencyFiles', () => {
    it('should fetch dependency files successfully', async () => {
      const projectId = 1;
      const defaultBranch = 'main';
      const dependencyFiles = ['file1.txt', 'file2.txt'];
      mockGitlabClient.findDependencyFiles.mockResolvedValue(dependencyFiles);

      const result = await fetchDependencyFiles(mockGitlabClient, projectId, defaultBranch, false);
      expect(result).toEqual(dependencyFiles);
      expect(mockGitlabClient.findDependencyFiles).toHaveBeenCalledWith(projectId.toString(), defaultBranch, false);
    });

    it('should log a warning and return an empty array if no dependency files are found', async () => {
      const projectId = 1;
      const defaultBranch = 'main';
      mockGitlabClient.findDependencyFiles.mockResolvedValue([]);

      const result = await fetchDependencyFiles(mockGitlabClient, projectId, defaultBranch, false);
      expect(result).toEqual([]);
      expect(mockGitlabClient.findDependencyFiles).toHaveBeenCalledWith(projectId.toString(), defaultBranch, false);
    });

    it('should log an error and rethrow if fetching dependency files fails', async () => {
      const projectId = 1;
      const defaultBranch = 'main';
      const error = new Error('Failed to fetch dependency files');
      mockGitlabClient.findDependencyFiles.mockRejectedValue(error);

      await expect(fetchDependencyFiles(mockGitlabClient, projectId, defaultBranch, false)).rejects.toThrow(error);
      expect(mockGitlabClient.findDependencyFiles).toHaveBeenCalledWith(projectId.toString(), defaultBranch, false);
    });
  });
});
