import 'reflect-metadata';
import {plainToInstance} from 'class-transformer';
import {IsDefined, IsString, validateSync} from 'class-validator';

export class Config {
    @IsString()
    @IsDefined()
    Url?: string;

    @IsString()
    @IsDefined()
    Token?: string;
}

export function NewClientConfig(): Config {
    const plainConfig = {
        Url: process.env.GITLAB_URL,
        Token: process.env.GITLAB_TOKEN,
        ProjectID: process.env.GITLAB_PROJECT_ID ? parseInt(process.env.GITLAB_PROJECT_ID) : undefined,
    };

    const config = plainToInstance(Config, plainConfig);
    const errors = validateSync(config, {skipMissingProperties: false});

    if (errors.length > 0) {
        throw new Error(errors.toString());
    }

    return config;
}
