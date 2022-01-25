import { LanguageCode, Result } from '@inlang/common';
import { Resources, SingleResource } from '@inlang/fluent-syntax';
import { AdapterInterface } from '..';
import { SerializedResource } from '../types/serializedResource';

/**
 * Serializes the provided resources.
 *
 * The provided adapter determines to which file format.
 */
export function serializeResources(args: {
    adapter: AdapterInterface;
    resources: Resources;
}): Result<SerializedResource[], Error> {
    const files: SerializedResource[] = [];
    for (const [languageCode, resource] of Object.entries(args.resources.resources)) {
        const serialized = args.adapter.serialize(resource as SingleResource);
        if (serialized.isErr) {
            return Result.err(serialized.error);
        }
        files.push({ data: serialized.value, languageCode: languageCode as LanguageCode });
    }
    return Result.ok(files);
}