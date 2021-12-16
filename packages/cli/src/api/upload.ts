import { TranslationFile, Result, AdapterInterface } from '@inlang/common';
import fetch from 'node-fetch';

export async function upload(args: {
  adapter: AdapterInterface;
  apiKey: string;
  files: TranslationFile[];
}): Promise<Result<void, Error>> {
  return fetch(
    process.env.VITE_PUBLIC_AUTH_REDIRECT_URL === undefined
      ? 'http://app.inlang.dev/api/download'
      : 'http://localhost:3000/api/download',
    {
      method: 'post',
      body: JSON.stringify({ apiKey: args.apiKey, files: args.files }),
      headers: { 'content-type': 'application/json' },
    }
  ).then((res) => (res.ok ? Result.ok(undefined) : Result.err(Error(res.status.toString()))));
}
