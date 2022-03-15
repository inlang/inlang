import { fs } from 'memfs';
import { readInlangConfig } from './readInlangConfig';
import { InlangConfig } from '@inlang/config';

it('should read inlang config', async () => {
    const path = 'example/inlang.config.json';
    fs.mkdirSync('example', { recursive: true });
    const config: InlangConfig['any'] = {
        $schema: 'https://raw.githubusercontent.com/inlang/inlang/main/packages/config/src/schemas/v0.1.json',
        fileFormat: 'fluent',
        pathPattern: './translations/{languageCode}.ftl',
    };
    fs.writeFileSync(path, JSON.stringify(config));
    const result = await readInlangConfig({ fs: fs.promises as any, path });
    expect(result.isOk).toBe(true);
});

it('it should return error on invalid config', async () => {
    const path = 'example/inlang.config.json';
    fs.mkdirSync('example', { recursive: true });
    const config: InlangConfig['any'] = {
        $schema: 'example.com',
        fileFormat: 'fluent',
        pathPattern: 'INVALID',
    };
    fs.writeFileSync(path, JSON.stringify(config));
    const result = await readInlangConfig({ fs: fs.promises as any, path });
    expect(result.isErr).toBe(true);
});