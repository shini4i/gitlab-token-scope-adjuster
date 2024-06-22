import { FileProcessor } from './fileProcessor';

interface Repository {
  type: string;
  url: string;
}

export class ComposerProcessor implements FileProcessor {
  extractDependencies(fileContent: string, gitlabUrl: string): Promise<string[]> {
    const dependencies: string[] = [];
    const strippedUrl = gitlabUrl.replace('https://', '');

    try {
      const composerJson = JSON.parse(fileContent);
      if (composerJson.repositories && typeof composerJson.repositories === 'object') {
        for (const [key, repo] of Object.entries(composerJson.repositories)) {
          const repository = repo as Repository;
          if (repository.url && repository.url.includes(strippedUrl)) {
            const formattedDep = repository.url.replace(`https://${strippedUrl}/`, '');
            dependencies.push(formattedDep);
          } else {
            console.log(`Skipping repository '${key}' with URL '${repository.url}' of unknown type '${repository.type}'`);
          }
        }
      }
    } catch (error) {
      console.error('Failed to parse composer.json file:', error);
    }

    return Promise.resolve(dependencies);
  }
}
