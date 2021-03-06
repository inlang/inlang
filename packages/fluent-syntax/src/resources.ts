import { LanguageCode, Result } from '@inlang/common';
import { remove } from 'lodash-es';
import { Attribute, Identifier, Message, Resource } from '@fluent/syntax';
import { isValidMessageId } from './utils/isValidMessageId';
import { parsePattern } from './utils/parsePattern';

/**
 * The API of this class could be improved.
 *
 * Most methods require a `languageCode` and act only on one resource.
 * Intead of defining functions like `getMessage` on all resources,
 * single resources could be extended to include those functions.
 * Getting a message from a resource could then be `resources.en.deleteMessage()`.
 * Functions that act on all resources would be called like `resources.deleteMessage()`.
 *
 * However:
 *  a) could lead to confusion e.g. single deletion, delete for all resources (see example above)?
 *  b) works only if resources always use languageCodes as ids. Maybe as on object it's possible:
 *      ```
 *      type Resources = {
 *          [resourceId: string] : SingleResource | undefined
 *          messageIds (of all resources)
 *          deleteMessage (for all resources)
 *          ...
 *      }
 *      ```
 */

/**
 * Utility type for consistency throughout the resources class.
 */
type RecordOfResources = Record<string, Resource | undefined>;

/**
 * Allows to parse files (as resources), act on those resources and serialize back to files.
 *
 * All messages, terms etc. are saved as files (resources) either in the local source code,
 * or the inlang database. In order to act on those files, they need to be parsed.
 * The parsed format is `Resource`. This class acts as wrapper around multiple `Resource`s
 * to act on all those resources at once.
 */
export class Resources {
    /**
     * Holds all resources as object accesible via a `languageCode`.
     *
     *
     * @example:
     *
     *      const x: RecordOfResources = {
     *          en: Resource,
     *          de: Resource
     *      }
     *      console.log(x.en)
     *      >> Resource
     *
     *
     */
    resources: RecordOfResources;

    constructor(args: { resources: RecordOfResources }) {
        this.resources = args.resources;
    }

    /**
     * The language codes contained in the resources.
     *
     * Example:
     * The resources contain "en", "de" and "fr".
     */
    containedLanguageCodes(): LanguageCode[] {
        return Object.entries(this.resources).map(([languageCode]) => languageCode as LanguageCode);
    }

    messageExist(args: { id: Message['id']['name']; languageCode: LanguageCode }): boolean {
        for (const entry of this.resources[args.languageCode]?.body ?? []) {
            if (entry.type === 'Message' && entry.id.name === args.id) {
                return true;
            }
        }
        return false;
    }

    /**
     * Whether or not an attribute exists.
     */
    attributeExists(args: {
        messageId: Message['id']['name'];
        id: Attribute['id']['name'];
        languageCode: LanguageCode;
    }): boolean {
        for (const entry of this.resources[args.languageCode]?.body ?? []) {
            if (entry.type === 'Message' && entry.id.name === args.messageId) {
                for (const attribute of entry.attributes) {
                    if (attribute.id.name === args.id) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    getMessage(args: { id: Message['id']['name']; languageCode: LanguageCode }): Message | undefined {
        for (const entry of this.resources[args.languageCode]?.body ?? []) {
            if (entry.type === 'Message' && entry.id.name === args.id) {
                return entry;
            }
        }
    }

    /**
     * Retrieves all messages with the given id of all resources.
     *
     * @returns A record holding the messages accessible via the languageCode.
     *
     * @example
     *      {
     *          "en": "Hello World",
     *          "de": "Hallo Welt"
     *      }
     */
    getMessageForAllResources(args: { id: Message['id']['name'] }): Record<string, Message | undefined> {
        const result: ReturnType<typeof this.getMessageForAllResources> = {};
        for (const [languageCode] of Object.entries(this.resources)) {
            const message = this.getMessage({ id: args.id, languageCode: languageCode as LanguageCode });
            result[languageCode] = message;
        }
        return result;
    }

    // overloading: empty pattern requires attributes
    createMessage(args: {
        id: Message['id']['name'];
        pattern?: string;
        languageCode: LanguageCode;
        attributes: Attribute[];
    }): Result<void, Error>;

    // overloading: defined pattern does not require attributes
    createMessage(args: {
        id: Message['id']['name'];
        pattern: string;
        languageCode: LanguageCode;
        attributes?: Attribute[];
    }): Result<void, Error>;

    /**
     * Creates a message.
     *
     * Note: Attributes can not be passed in the `pattern`.
     */
    createMessage(args: {
        id: Message['id']['name'];
        pattern?: string;
        languageCode: LanguageCode;
        attributes?: Attribute[];
    }): Result<void, Error> {
        if (
            (args.pattern === undefined || args.pattern.trim() === '') &&
            (args.attributes === undefined || args.attributes.length === 0)
        ) {
            return Result.err(Error('The message has no pattern. Thus, at least one attribute is required.'));
        }
        if (this.messageExist({ id: args.id, languageCode: args.languageCode })) {
            return Result.err(
                Error(`Message id ${args.id} already exists for the language code ${args.languageCode}.`)
            );
        } else if (isValidMessageId(args.id) === false) {
            return Result.err(Error(`Message id ${args.id} is not a valid id.`));
        } else if (this.resources[args.languageCode] === undefined) {
            return Result.err(Error(`No resource for the language code ${args.languageCode} exits.`));
        }
        const message = new Message(new Identifier(args.id));
        if (args.pattern) {
            const parsed = parsePattern(args.pattern);
            if (parsed.isErr) {
                return Result.err(parsed.error);
            }
            message.value = parsed.value;
        }
        if (args.attributes) {
            message.attributes = args.attributes;
        }
        this.resources[args.languageCode]?.body.push(message);
        return Result.ok(undefined);
    }

    deleteMessage(args: { id: Message['id']['name']; languageCode: LanguageCode }): Result<void, Error> {
        const removed = remove(
            this.resources[args.languageCode]?.body ?? [],
            (resource) => (resource.type === 'Message' || resource.type === 'Term') && resource.id.name === args.id
        );
        if (removed.length === 0) {
            return Result.err(Error(`Message with id ${args.id} does not exist in resource ${args.languageCode}`));
        }
        return Result.ok(undefined);
    }

    deleteMessageForAllResources(args: { id: Message['id']['name'] }): Result<void, Error> {
        for (const [languageCode] of Object.entries(this.resources)) {
            if (this.messageExist({ id: args.id, languageCode: languageCode as LanguageCode })) {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const deletion = this.deleteMessage({ id: args.id, languageCode: languageCode as LanguageCode });
                // dont return an error (if a message does not exist for this language code)
                // if (deletion.isErr) {
                //     return Result.err(deletion.error);
                // }
            }
        }
        return Result.ok(undefined);
    }

    getMessageIds(args: { languageCode: LanguageCode }): Set<Message['id']['name']> {
        const result: Set<string> = new Set();
        for (const entry of this.resources[args.languageCode]?.body ?? []) {
            if (entry.type === 'Message') {
                result.add(entry.id.name);
            }
        }
        return result;
    }

    getMessageIdsForAllResources(): Set<Message['id']['name']> {
        let result: Set<string> = new Set();
        for (const languageCode of this.containedLanguageCodes()) {
            // concating both sets
            result = new Set([...result, ...this.getMessageIds({ languageCode })]);
        }
        return result;
    }

    updateMessage(args: { id: Message['id']['name']; languageCode: LanguageCode; with: Message }): Result<void, Error> {
        if (args.id !== args.with.id.name) {
            return Result.err(Error('The given id does not match the with.id'));
        }
        const resource = this.resources[args.languageCode];
        if (resource === undefined) {
            return Result.err(Error(`Resource for language code ${args.languageCode} does not exist.`));
        }
        const indexOfMessage = resource.body.findIndex(
            (entry) => entry.type === 'Message' && entry.id.name === args.id
        );
        if (indexOfMessage === -1) {
            return Result.err(
                Error(`Message with id '${args.id}' does not exist for the language code ${args.languageCode}.`)
            );
        }
        resource.body[indexOfMessage] = args.with;
        return Result.ok(undefined);
    }

    // ----------- attributes -------------

    /**
     * Creates an attribute of a message.
     *
     * If the message does not exist, the message is created too.
     */
    createAttribute(args: {
        messageId: Message['id']['name'];
        id: Attribute['id']['name'];
        pattern: string;
        languageCode: LanguageCode;
    }): Result<void, Error> {
        const message = this.getMessage({ id: args.messageId, languageCode: args.languageCode });
        if (message?.attributes.some((attribute) => attribute.id.name === args.id)) {
            return Result.err(
                Error(`Attribute with id ${args.id} exists already for language "${args.languageCode}".`)
            );
        }
        const parsedPattern = parsePattern(args.pattern);
        if (parsedPattern.isErr) {
            return Result.err(parsedPattern.error);
        }
        const attribute = new Attribute(new Identifier(args.id), parsedPattern.value);
        if (message) {
            message.attributes.push(attribute);
            return this.updateMessage({ id: args.messageId, languageCode: args.languageCode, with: message });
        } else {
            return this.createMessage({ id: args.messageId, languageCode: args.languageCode, attributes: [attribute] });
        }
    }

    /**
     * Get an attribute of a message.
     *
     * Returns undefined if the message, or the attribute itself does not exist.
     */
    getAttribute(args: {
        messageId: Message['id']['name'];
        id: Attribute['id']['name'];
        languageCode: LanguageCode;
    }): Attribute | undefined {
        const message = this.getMessage({ id: args.messageId, languageCode: args.languageCode });
        const attribute = message?.attributes.find((attribute) => attribute.id.name === args.id);
        return attribute;
    }

    /**
     * Retrieves all attributes with the given ids for all resources.
     *
     * @returns A record holding the messages accessible via the languageCode.
     *
     * @example
     *      {
     *          "en": Attribute
     *          "de": Attribute
     *      }
     */
    getAttributeForAllResources(args: {
        messageId: Message['id']['name'];
        id: Attribute['id']['name'];
    }): Record<string, Attribute | undefined> {
        const result: ReturnType<typeof this.getAttributeForAllResources> = {};
        for (const [languageCode] of Object.entries(this.resources)) {
            const attribute = this.getAttribute({
                messageId: args.messageId,
                id: args.id,
                languageCode: languageCode as LanguageCode,
            });
            result[languageCode] = attribute;
        }
        return result;
    }

    /**
     * Updates an attribute of a message.
     */
    updateAttribute(args: {
        messageId: Message['id']['name'];
        id: Attribute['id']['name'];
        languageCode: LanguageCode;
        with: Attribute;
    }): Result<void, Error> {
        const message = this.getMessage({ id: args.messageId, languageCode: args.languageCode });
        if (message === undefined) {
            return Result.err(
                Error(`The message "${args.messageId}" does not exist for the language ${args.languageCode}`)
            );
        }
        const indexOfAttribute = message.attributes.findIndex((attribute) => attribute.id.name === args.id);
        if (indexOfAttribute === -1) {
            return Result.err(
                Error(
                    `Attribute with id '${args.id}' does not exist for the message ${args.messageId} with language ${args.languageCode}.`
                )
            );
        }
        // replace existent attribute at that index
        message.attributes[indexOfAttribute] = args.with;

        return this.updateMessage({ id: args.messageId, languageCode: args.languageCode, with: message });
    }

    /**
     * Deletes an attribute of a message.
     */
    deleteAttribute(args: {
        messageId: Message['id']['name'];
        id: Attribute['id']['name'];
        languageCode: LanguageCode;
    }): Result<void, Error> {
        const message = this.getMessage({ id: args.messageId, languageCode: args.languageCode });
        if (message === undefined) {
            return Result.err(
                Error(`The message "${args.messageId}" does not exist for the language ${args.languageCode}`)
            );
        }
        const removed = remove(message.attributes, (attribute) => attribute.id.name === args.id);
        if (removed.length === 0) {
            return Result.err(
                Error(
                    `Attribute with id '${args.id}' does not exist for the message ${args.messageId} with language ${args.languageCode}.`
                )
            );
        }
        return Result.ok(undefined);
    }

    /**
     * Deletes the attribute with the given id for all resources.
     */
    deleteAttributeForAllResources(args: { messageId: Message['id']['name']; id: string }): Result<void, Error> {
        for (const [languageCode] of Object.entries(this.resources)) {
            if (this.messageExist({ id: args.messageId, languageCode: languageCode as LanguageCode })) {
                const deletion = this.deleteAttribute({
                    messageId: args.messageId,
                    id: args.id,
                    languageCode: languageCode as LanguageCode,
                });
                if (deletion.isErr) {
                    return Result.err(deletion.error);
                }
            }
        }
        return Result.ok(undefined);
    }
}
