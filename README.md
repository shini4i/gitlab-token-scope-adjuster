# GitLab CI Job Token Scope Adjuster

This CLI tool helps automate the process of configuring CI job token scopes in GitLab projects. 

Starting from GitLab 16, it is mandatory to explicitly configure `CI_JOB_TOKEN` access, and this tool simplifies that by automating the necessary API calls.

> [!WARNING]
> This project is currently in the Proof of Concept (PoC) stage and may be error-prone. It is not recommended for use in production environments.

## How it works?

- Fetches project details from GitLab.
- Identifies dependency files (`go.mod`, `composer.json`) in the repository.
- Extracts dependencies from these files.
- Configures CI job token scopes to whitelist the source project in dependency projects.

## Prerequisites

- Node.js (>= 14.x)
- ts-node
- GitLab access token with the necessary permissions

## Installation

Clone the repository:

```sh
git clone https://github.com/shini4i/gitlab-token-scope-adjuster.git
cd gitlab-token-scope-adjuster
```

Install dependencies:

```sh
npm install
```

## Configuration

Expose the following environment variable:
```sh
export GITLAB_URL=https://gitlab.example.com
export GITLAB_TOKEN=your_access_token
```

## Usage

The simplest approach would be:
```sh
make run PROJECT_ID=<your_project_id>
```
or
```sh
ts-node src/scripts/adjust-token-scope.ts -p <your_project_id>
```

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
