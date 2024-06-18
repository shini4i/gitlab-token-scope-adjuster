import {NewGitlabClient} from './gitlabClient';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';

let mock: MockAdapter;

beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
});

beforeEach(() => {
    mock = new MockAdapter(axios);
});

afterEach(() => {
    mock.restore();
});

test('getProject makes a GET request and returns data', async () => {
    const client = NewGitlabClient('https://gitlab.example.com', 'MyToken');
    const projectId = '1';

    // simulate a successful server response
    const projectData = {id: 1, name: 'My Project'};
    mock.onGet(`https://gitlab.example.com/api/v4/projects/${projectId}`).reply(200, projectData);

    const project = await client.getProject(projectId);

    expect(project).toEqual(projectData);
});

test('getFileContent makes a GET request and returns data', async () => {
    const client = NewGitlabClient('https://gitlab.example.com', 'MyToken');

    // simulate a successful server response
    const fileContent = 'SGVsbG8sIHdvcmxkIQ=='; // Hello, world! encoded in Base64
    const fileData = {
        file_path: 'test.txt',
        encoding: 'base64',
        content: fileContent,
    };

    const projectId = 1;
    const filePath = 'test.txt';
    const branch = 'master';

    const encodedFilePath = encodeURIComponent(filePath);

    mock.onGet(`https://gitlab.example.com/api/v4/projects/${projectId}/repository/files/${encodedFilePath}`)
        .reply(200, fileData);

    const content = await client.getFileContent(projectId, filePath, branch);

    expect(content).toEqual(Buffer.from(fileContent, 'base64').toString('utf8'));
});

test('findDependencyFiles returns an empty array when no dependency files are found', async () => {
    const client = NewGitlabClient('https://gitlab.example.com', 'MyToken');
    const projectId = '1';
    const branch = 'master';

    const repositoryTree = [{name: 'other-file.txt'}, {name: 'another-file.js'}];

    mock.onGet(`https://gitlab.example.com/api/v4/projects/${projectId}/repository/tree`)
        .reply(200, repositoryTree);

    const files = await client.findDependencyFiles(projectId, branch);

    expect(files).toEqual([]);
});

test('findDependencyFiles makes a GET request and returns dependency files', async () => {
    const client = NewGitlabClient('https://gitlab.example.com', 'MyToken');
    const projectId = '1';
    const branch = 'master';

    const repositoryTree = [{name: 'go.mod'}, {name: 'composer.json'}, {name: 'other-file.txt'}];

    mock.onGet(`https://gitlab.example.com/api/v4/projects/${projectId}/repository/tree`)
        .reply(200, repositoryTree);

    const files = await client.findDependencyFiles(projectId, branch);

    expect(files).toEqual(['go.mod', 'composer.json']);
});

test('getProjectId makes a GET request and returns data', async () => {
    const client = NewGitlabClient('https://gitlab.example.com', 'MyToken');
    const path_with_namespace = 'mygroup/myproject';

    const projectData = {id: 1, name: 'My Project'};
    const encodedPathWithNamespace = encodeURIComponent(path_with_namespace);
    mock.onGet(`https://gitlab.example.com/api/v4/projects/${encodedPathWithNamespace}`).reply(200, projectData);

    const projectId = await client.getProjectId(path_with_namespace);

    expect(projectId).toEqual(projectData.id);
});

test('allowCiJobTokenAccess makes a POST request to the correct endpoint', async () => {
    const client = NewGitlabClient('https://gitlab.example.com', 'MyToken');
    const sourceProjectId = '1';
    const targetProjectId = '2';

    mock.onPost(`https://gitlab.example.com/api/v4/projects/${sourceProjectId}/job_token_scope/allowlist`, {target_project_id: targetProjectId})
        .reply(201);

    await client.allowCiJobTokenAccess(sourceProjectId, targetProjectId);
    expect(mock.history.post.length).toBe(1);

    // check if headers are defined before attempting to access properties
    if (mock.history.post[0].headers) {
        const headers = mock.history.post[0].headers;

        expect(headers['PRIVATE-TOKEN']).toEqual('MyToken');
        expect(headers['Content-Type']).toEqual('application/json');
        expect(headers['Accept']).toEqual('application/json, text/plain, */*');
    } else {
        throw new Error('Headers are undefined');
    }
});

test('isProjectWhitelisted returns true if the project is in the job token scope allowlist', async () => {
    const client = NewGitlabClient('https://gitlab.example.com', 'MyToken');
    const sourceProjectId = 1; // Using a project ID that exists in the allowlist
    const depProjectId = 2; // The ID of the other project is arbitrary in this case, since we are mocking the response

    // Simulate a successful server response with the source project included in the allowlist
    const allowList = [{id: 1, name: 'project1'}, {id: 3, name: 'project3'}];
    mock.onGet(`https://gitlab.example.com/api/v4/projects/${depProjectId}/job_token_scope/allowlist`).reply(200, allowList);

    const isWhitelisted = await client.isProjectWhitelisted(sourceProjectId, depProjectId);

    expect(isWhitelisted).toEqual(true);
});

test('isProjectWhitelisted returns false if the project is not in the job token scope allowlist', async () => {
    const client = NewGitlabClient('https://gitlab.example.com', 'MyToken');
    const sourceProjectId = 2; // Using a project ID that does not exist in the allowlist
    const depProjectId = 3; // The ID of the other project is arbitrary in this case, since we are mocking the response

    // Simulate a successful server response with the source project included in the allowlist
    const allowList = [{id: 1, name: 'project1'}, {id: 3, name: 'project3'}];
    mock.onGet(`https://gitlab.example.com/api/v4/projects/${depProjectId}/job_token_scope/allowlist`).reply(200, allowList);

    const isWhitelisted = await client.isProjectWhitelisted(sourceProjectId, depProjectId);

    expect(isWhitelisted).toEqual(false);
});

test('getProject logs error and rethrows on failure', async () => {
    const client = NewGitlabClient('https://gitlab.example.com', 'MyToken');
    const projectId = '1';

    mock.onGet(`https://gitlab.example.com/api/v4/projects/${projectId}`).reply(500);

    await expect(client.getProject(projectId)).rejects.toThrow();
});

test('isProjectWhitelisted logs error and rethrows on failure', async () => {
    const client = NewGitlabClient('https://gitlab.example.com', 'MyToken');
    const sourceProjectId = 1;
    const depProjectId = 2;

    mock.onGet(`https://gitlab.example.com/api/v4/projects/${depProjectId}/job_token_scope/allowlist`).reply(500);

    await expect(client.isProjectWhitelisted(sourceProjectId, depProjectId)).rejects.toThrow();
});

test('getFileContent throws error on unexpected encoding', async () => {
    const client = NewGitlabClient('https://gitlab.example.com', 'MyToken');
    const projectId = 1;
    const filePath = 'test.txt';
    const branch = 'master';

    const fileData = {
        file_path: 'test.txt',
        encoding: 'utf8',
        content: 'Hello, world!',
    };

    const encodedFilePath = encodeURIComponent(filePath);

    mock.onGet(`https://gitlab.example.com/api/v4/projects/${projectId}/repository/files/${encodedFilePath}`)
        .reply(200, fileData);

    await expect(client.getFileContent(projectId, filePath, branch)).rejects.toThrow('Unexpected encoding of file content received from GitLab API');
});

test('findDependencyFiles makes a GET request and returns dependency files across paginated responses', async () => {
    const client = NewGitlabClient('https://gitlab.example.com', 'MyToken');
    const projectId = '1';
    const branch = 'master';

    const repositoryTreePage1 = [{name: 'go.mod'}, {name: 'file1.txt'}];
    const repositoryTreePage2 = [{name: 'composer.json'}, {name: 'file2.txt'}];

    // Mock the first page of the repository tree
    mock.onGet(`https://gitlab.example.com/api/v4/projects/${projectId}/repository/tree`, {
        params: {
            ref: branch,
            recursive: false,
            page: 1,
            per_page: 20,
        },
    }).reply(200, repositoryTreePage1, {'x-next-page': '2'});

    // Mock the second page of the repository tree
    mock.onGet(`https://gitlab.example.com/api/v4/projects/${projectId}/repository/tree`, {
        params: {
            ref: branch,
            recursive: false,
            page: 2,
            per_page: 20,
        },
    }).reply(200, repositoryTreePage2, {'x-next-page': ''});

    const files = await client.findDependencyFiles(projectId, branch);

    expect(files).toEqual(['go.mod', 'composer.json']);
});

test('gitlab client should return the correct url', async () => {
    const client = NewGitlabClient('https://gitlab.example.com', 'MyToken');
    expect(client.Url).toEqual('https://gitlab.example.com')
});
