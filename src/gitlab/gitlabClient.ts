import axios, {AxiosRequestConfig, Method} from 'axios';

export class GitlabClient {
    private readonly url: string;
    private readonly token: string;

    constructor(Url: string, Token: string) {
        this.url = Url;
        this.token = Token;
    }

    get Url(): string {
        return this.url
    }

    private async executeRequest(method: Method, endpoint: string, data?: any, config?: any): Promise<any> {
        const url = `${this.url}/api/v4/${endpoint}`;

        const headers = {
            'PRIVATE-TOKEN': this.token,
            'Content-Type': 'application/json',
            ...(config?.headers || {}),
        };

        const axiosConfig: AxiosRequestConfig = {
            ...config,
            method,
            url,
            headers,
            data,
        };

        try {
            return await axios(axiosConfig);
        } catch (error) {
            console.error(`Request failed: ${method} ${url}`);
            throw error;
        }
    }

    async getProject(id: string) {
        return (await this.executeRequest('get', `projects/${id}`)).data;
    }

    async getProjectId(path_with_namespace: string) {
        return (await this.executeRequest('get', `projects/${encodeURIComponent(path_with_namespace)}`)).data.id;
    }

    async isProjectWhitelisted(sourceProjectId: number, depProjectId: number) {
        try {
            const allowList = (await this.executeRequest('get', `projects/${depProjectId}/job_token_scope/allowlist`)).data;
            return allowList.some((project: any) => project.id === sourceProjectId);
        } catch (error) {
            console.error(`Request failed: GET job_token_scope/allowlist`);
            throw error;
        }
    }

    async allowCiJobTokenAccess(sourceProjectId: string, targetProjectId: string) {
        await this.executeRequest('post', `projects/${sourceProjectId}/job_token_scope/allowlist`, {
            target_project_id: targetProjectId,
        });
    }

    async findDependencyFiles(id: string, branch: string, isMonorepo: boolean = false) {
        const targetFiles = ['go.mod', 'composer.json', "package-lock.json"];
        let files: any[] = [];
        let page = 1;
        let hasNextPage = true;

        while (hasNextPage) {
            const response = await this.executeRequest('get', `projects/${id}/repository/tree`, null, {
                params: {
                    ref: branch,
                    recursive: isMonorepo, //Use isMonorepo flag to decide whether to fetch files recursively
                    page,
                    per_page: 20,
                },
            });

            files = files.concat(response.data);
            const nextPage = response.headers['x-next-page'];
            hasNextPage = nextPage !== '' && !isNaN(Number(nextPage));
            page++;
        }

        // If it's a monorepo, files parameter contains path to file
        return files.map((f: { path: any; name: any; }) => isMonorepo ? f.path : f.name)
            .filter((name: string) => targetFiles.some(file => name.endsWith(file)));
    }

    async getFileContent(id: number, file_path: string, branch: string) {
        const encodedFilePath = encodeURIComponent(file_path);
        const response = await this.executeRequest('get', `projects/${id}/repository/files/${encodedFilePath}`, null, {params: {ref: branch}});

        if (response.data.encoding !== 'base64') {
            throw new Error('Unexpected encoding of file content received from GitLab API');
        }

        return Buffer.from(response.data.content, 'base64').toString('utf8');
    }
}

export function NewGitlabClient(Url: string, Token: string) {
    return new GitlabClient(Url, Token);
}
