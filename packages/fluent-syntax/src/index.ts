// this package "extends" `@fluent/syntax`, thus export all from `@fluent/syntax`
export * from '@fluent/syntax';
// "extensions" are exported below
export * from './resources';
export * from './types/serializedResource';
export * from './types/singleResource';
export * from './utils/isValidMessageId';
export * from './utils/isValidTermId';
export * from './utils/serializeEntry';
export * from './utils/parseEntry';
