<script lang="ts">
	import ISO6391 from 'iso-639-1';
	import { Modal, TextArea, TextInput } from 'carbon-components-svelte';
	import { projectStore } from '$lib/stores/projectStore';
	import { page } from '$app/stores';
	import { autoCloseModalOnSuccessTimeout } from '$lib/utils/timeouts';
	import { isValidMessageId, isValidAttributeId } from '@inlang/fluent-syntax';
	import InlineLoadingWrapper from '../InlineLoadingWrapper.svelte';
	import { t } from '$lib/services/i18n';

	let open = false;

	export function show(): void {
		id = '';
		serializedPattern = '';
		status = 'inactive';
		open = true;
		// only god knows why focus has to be wrapped in a setTimeout to work
		setTimeout(() => {
			keyNameInputElement.focus();
		});
	}

	let serializedPattern = '';

	let status: InlineLoadingWrapper['$$prop_def']['status'] = 'inactive';

	// the id is in the format of `message.attribute`
	let id = '';
	$: messageId = id.split('.')[0] ?? '';
	$: attributeId = id.split('.')[1] ?? '';

	// $: isValidId =
	// 	id.includes('.') && isValidMessageId(id.split('.')[0]) && isValidAttributeId(id.split('.')[1]);

	$: isValidInput = isValidId() && serializedPattern !== '';
	let isValidId: () => { value: boolean; message: string };
	$: isValidId = () => {
		if (id.includes('.') === false) {
			return { value: false, message: $t('error.attribute-must-contain-dot') };
		} else if (id.split('.').length > 2) {
			return {
				value: false,
				message: $t('error.only-one-nested-attribute-allowed')
			};
		}
		// attribute id is not written out yet
		else if (isValidMessageId(id.split('.')[0]) === true && id.split('.')[1] === '') {
			return {
				value: true,
				message: ''
			};
		} else if (
			isValidMessageId(id.split('.')[0]) === false ||
			isValidAttributeId(id.split('.')[1]) === false
		) {
			return {
				value: false,
				message: $t('error.id-invalid-character')
			};
		} else if (
			$projectStore.data?.resources.attributeExists({
				messageId,
				id,
				languageCode: $projectStore.data.project.base_language_code
			})
		) {
			return {
				value: false,
				message: $t('error.attribute-exists')
			};
		}
		return {
			value: true,
			message: ''
		};
	};

	let keyNameInputElement: HTMLInputElement;

	async function handleSubmission(): Promise<void> {
		status = 'active';
		if ($projectStore.data === null) {
			alert('Projectstore.data was null');
			status = 'error';
			return;
		}
		const create = $projectStore.data.resources.createAttribute({
			messageId: messageId,
			id: attributeId,
			pattern: serializedPattern,
			languageCode: $projectStore.data.project.base_language_code
		});
		if (create.isErr) {
			status = 'error';
			alert(create.error);
			return;
		}
		const updateDatabase = await projectStore.updateResourcesInDatabase();
		if (updateDatabase.isErr) {
			status = 'error';
			alert(updateDatabase.error);
		} else {
			status = 'finished';
			projectStore.getData({ projectId: $page.params.projectId });
			// automatically closing the modal but leave time to
			// let the user read the result status of the action
			setTimeout(() => {
				open = false;
			}, autoCloseModalOnSuccessTimeout);
		}
	}
</script>

<Modal
	bind:open
	modalHeading={$t('new.attribute')}
	size="sm"
	primaryButtonText={$t('generic.create')}
	secondaryButtonText={$t('generic.cancel')}
	on:click:button--secondary={() => {
		open = false;
	}}
	on:submit={handleSubmission}
	preventCloseOnClickOutside
	primaryButtonDisabled={isValidInput === false}
	shouldSubmitOnEnter={false}
>
	<p>{$t('definition.attribute')}</p>
	<br />
	<img class="h-10" src="/attribute-visualization.svg" alt="Attribute visualization." />
	<br />
	<br />
	<!-- 
		bug: keyNameIsValid is not showing once the user enters a duplicativ key, but works for the primary button (wtf?) 
	   	not of importance to fix for now.
	-->
	<TextInput
		invalid={id !== '' && isValidId().value === false}
		invalidText={isValidId().message}
		labelText="Id"
		bind:value={id}
		bind:ref={keyNameInputElement}
	/>
	<br />
	<TextArea
		rows={2}
		labelText={`Pattern`}
		bind:value={serializedPattern}
		helperText={$t('info.new-pattern-base-language', {
			baseLanguageCode: $projectStore.data?.project.base_language_code ?? ''
		})}
	/>
	<br />
	{#if status !== 'inactive'}
		<InlineLoadingWrapper
			{status}
			activeDescription={$t('loading.creating-attribute')}
			finishedDescription={$t('loading.attribute-created')}
		/>
	{/if}
</Modal>
