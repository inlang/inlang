import { AdapterInterface } from '@inlang/common/src/adapters/index';
import type { TranslationFile } from '@inlang/common/src/types/translationFile';
import { Result } from '@inlang/common/src/types/result';
import fetch from 'node-fetch';

export async function upload(args: {
  adapter: AdapterInterface;
  apiKey: string;
  files: TranslationFile[];
}): Promise<Result<void, Error>> {
  return fetch(process.env.VITE_PUBLIC_AUTH_REDIRECT_URL + '/api/upload' ?? 'http://localhost:3000/api/upload', {
    method: 'post',
    body: JSON.stringify({ apiKey: args.apiKey, files: args.files }),
    headers: { 'content-type': 'application/json' },
  }).then((res) => (res.ok ? Result.ok(undefined) : Result.err(Error(res.status.toString()))));
}