<div align="center">

# GitLab CI Job Token Scope Adjuster

![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/shini4i/gitlab-token-scope-adjuster/publish.yaml?label=publish)
![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/shini4i/gitlab-token-scope-adjuster/tests.yaml?label=tests)
![NPM Downloads](https://img.shields.io/npm/dm/%40shini4i%2Fgitlab-token-scope-adjuster)
![NPM Version](https://img.shields.io/npm/v/%40shini4i%2Fgitlab-token-scope-adjuster)
[![codecov](https://codecov.io/github/shini4i/gitlab-token-scope-adjuster/graph/badge.svg?token=ELQ6VQJ0Z5)](https://codecov.io/github/shini4i/gitlab-token-scope-adjuster)
![GitHub License](https://img.shields.io/github/license/shini4i/gitlab-token-scope-adjuster)

</div>

This CLI tool helps automate the process of configuring CI job token scopes in GitLab projects.

Starting from GitLab 16, it is mandatory to explicitly configure `CI_JOB_TOKEN` access, and this tool simplifies that by
automating the necessary API calls.

> [!WARNING]
> This project is currently in the Proof of Concept (PoC) stage and may be error-prone. It is not recommended for use in production environments.

## How it works?

- Fetches project details from GitLab.
- Identifies dependency files (`go.mod`, `composer.json`, `package-lock.json`) in the repository.
- Extracts dependencies from these files.
- Configures CI job token scopes to whitelist the source project in dependency projects.

```mermaid
graph LR
    A[gitlab-token-scope-adjuster -p 1234] --> B[Fetch Project Details]
    B --> C[Identify Dependency Files]
    C --> D[Process Each Dependency File]
    D --> E[Extract Dependencies]
    E --> F[Whitelist project CI_JOB_TOKEN in the Dependency Project]
```

> [!NOTE]
> More dependency file types will be added soon. Contributions and suggestions are welcome!

## Prerequisites

- Node.js (>= 22.x)
- ts-node
- GitLab access token with the necessary permissions

## Installation

Install [@shini4i/gitlab-token-scope-adjuster](https://www.npmjs.com/package/@shini4i/gitlab-token-scope-adjuster) package:

```sh
npm install -g @shini4i/gitlab-token-scope-adjuster
```

## Usage

Expose the following environment variable:

```sh
export GITLAB_URL=https://gitlab.example.com
export GITLAB_TOKEN=your_access_token
```

And run the following command:

```sh
gitlab-token-scope-adjuster -p <your_project_id>
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
