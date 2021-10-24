import { database } from './services/database.js'
import { storeTranslationsToDisk } from 'typesafe-i18n/importer'
import type { BaseTranslation } from 'typesafe-i18n/types/core'
import type { LocaleMapping } from './types/LocaleMapping'
import { isEqual } from 'lodash-es';
import { readFile } from 'fs/promises';

// Recursive function as it is assumed that namespace is not deep enough to cause stack overflow.
function createNestedObject(
    base: BaseTranslation,
    names: string[],
    text: string
) {
    if (names.length === 1) {
        base[names[0]] = text
    } else {
        if (base[names[0]] === undefined) {
            base[names[0]] = {}
        }
        base[names[0]] = createNestedObject(
            base[names[0]] as BaseTranslation,
            names.slice(1),
            text
        )
    }
    return base
}

/**
 * Global variable which keeps track of the last locale mapping list.
 *
 * Exists to prevent constant re-writes as the current implementation is naive in the sense
 * that is polls in a specified interval instead of using a subscription.
 */
let lastLocaleMappingList: LocaleMapping[] = []

async function updateTranslations(args: { projectId: string }) {
    const translations = await database
        .from('translation')
        .select('*')
        .eq('project_id', args.projectId)

    const localeMappingList: LocaleMapping[] = []

    for (const t of translations.data ?? []) {
        let localeMapping = localeMappingList.find(
            (l) => l.locale === t.iso_code
        )
        if (localeMapping === undefined) {
            localeMappingList.push({ locale: t.iso_code, translations: {} })
            localeMapping = localeMappingList[localeMappingList.length - 1]
        }
        const nest = t.key_name.split('.')
        localeMapping.translations = createNestedObject(
            localeMapping.translations,
            nest,
            t.text ?? ''
        )
    }
    if (isEqual(localeMappingList, lastLocaleMappingList) === false) {
        await storeTranslationsToDisk(localeMappingList)
        lastLocaleMappingList = localeMappingList
    }
}

async function main() {
    //@ts-ignore
    const config = JSON.parse(
        await readFile(
          //@ts-ignore
          new URL('../../../../inlang.config.json', import.meta.url)
        )
      );
    if (config === undefined) {
        const message =
            '@inlang/typesafe-i18n-importer: Config file "inlang.config.json" has not been found.'
        console.error(message)
        throw message
    } else if (config.projectId === undefined) {
        const message =
            '@inlang/typesafe-i18n-importer: Config file found but "projectId" is not defined.'
        console.error(message)
        throw message
    }
    setInterval(() => updateTranslations({ projectId: config.projectId }), 2000)
}

main()
