import { NewClientConfig } from './clientConfig';

describe('NewClientConfig function', () => {
  beforeEach(() => {
    jest.resetModules();

    process.env.GITLAB_URL = 'https://gitlab.example.com';
    process.env.GITLAB_TOKEN = 'abcdefgh12345678';
    process.env.GITLAB_PROJECT_ID = '1234';
  });

  test('should successfully return a Config when environment variables are set', () => {
    const config = NewClientConfig();
    expect(config).toHaveProperty('Url', 'https://gitlab.example.com');
    expect(config).toHaveProperty('Token', 'abcdefgh12345678');
  });

  test('should throw an error when an environment variable is not set', () => {
    delete process.env.GITLAB_URL;
    expect(NewClientConfig).toThrow();
  });
});
