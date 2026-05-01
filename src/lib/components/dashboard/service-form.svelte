<script lang="ts">
	import { MediaQuery } from 'svelte/reactivity';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Drawer from '$lib/components/ui/drawer';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Clock, LoaderCircle, CalendarClock, Coffee } from '@lucide/svelte';
	import { superForm } from 'sveltekit-superforms';
	import { toast } from 'svelte-sonner';

	let {
		formData,
		service = null,
		open = $bindable(),
		initialName = '',
		onSuccess
	} = $props<{
		formData: any;
		service?: any;
		open: boolean;
		initialName?: string;
		onSuccess?: (newService: any) => void;
	}>();

	const isDesktop = new MediaQuery('(min-width: 640px)');
	let isLoading = $state(false);

	const { form, errors, enhance, constraints, message } = superForm(formData, {
		resetForm: true,
		invalidateAll: true,
		onSubmit: () => {
			isLoading = true;
		},
		onResult: () => {
			isLoading = false;
		},
		onUpdated: ({ form }) => {
			if (form.valid) {
				toast.success('Serviço guardado com sucesso!');
				const resultData = form.message?.id ? form.message : form.data;
				onSuccess?.(resultData);
				open = false;
			} else if (typeof $message === 'string') {
				toast.error($message);
			}
		},
		onError: () => {
			toast.error('Erro ao salvar serviço');
		}
	});

	$effect(() => {
		if (open) {
			if (service) {
				$form.id = service.id;
				$form.name = service.name;
				$form.duration = service.duration;
				$form.min_notice_hours = service.min_notice_hours ?? 2;
				$form.buffer_after_min = service.buffer_after_min ?? 0;
			} else {
				$form.id = '';
				$form.name = initialName || '';
				$form.duration = 30;
				$form.min_notice_hours = 2;
				$form.buffer_after_min = 0;
			}
		}
	});
</script>

{#snippet fields()}
	<div class="grid gap-4">
		<div class="grid gap-2">
			<Label for="name" class={$errors.name ? 'text-destructive' : ''}>Nome do serviço</Label>
			<Input
				id="name"
				name="name"
				bind:value={$form.name}
				placeholder="Ex: Corte de Cabelo"
				{...$constraints.name}
			/>
			{#if $errors.name}
				<span class="text-xs font-medium text-destructive">{$errors.name}</span>
			{/if}
		</div>

		<div class="grid gap-2">
			<Label for="duration">Duração (minutos)</Label>
			<div class="relative">
				<Clock class="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
				<Input
					id="duration"
					name="duration"
					type="number"
					class="pl-9"
					bind:value={$form.duration}
					{...$constraints.duration}
				/>
			</div>
		</div>
	</div>

	<div class="grid gap-4">
		<div class="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
			<CalendarClock class="h-4 w-4" /> Regras de Agendamento
		</div>

		<div class="grid gap-2">
			<Label for="min_notice_hours">Antecedência Mínima (horas)</Label>
			<Input
				id="min_notice_hours"
				name="min_notice_hours"
				type="number"
				bind:value={$form.min_notice_hours}
			/>
			<p class="text-[11px] text-muted-foreground italic">Evita agendamentos de última hora.</p>
		</div>

		<div class="grid gap-2">
			<Label for="buffer_after_min">Intervalo de Respiro (minutos)</Label>
			<div class="relative">
				<Coffee class="absolute top-2 left-2.5 h-4 w-4 text-muted-foreground" />
				<Input
					id="buffer_after_min"
					name="buffer_after_min"
					type="number"
					class="pl-9"
					bind:value={$form.buffer_after_min}
				/>
			</div>
			<p class="text-[11px] text-muted-foreground italic">
				Tempo livre após o serviço para limpeza/descanso.
			</p>
		</div>
	</div>
{/snippet}

{#snippet submitButton()}
	<Button type="submit" disabled={isLoading} class="w-full cursor-pointer">
		{#if isLoading}
			<LoaderCircle class="mr-2 h-4 w-4 animate-spin" /> Salvando...
		{:else}
			{$form.id ? 'Salvar Alterações' : 'Criar Serviço'}
		{/if}
	</Button>
{/snippet}

{#if isDesktop.current}
	<Dialog.Root bind:open>
		<Dialog.Content class="flex max-h-[95dvh] flex-col gap-0 p-0 sm:max-w-[400px]">
			<Dialog.Header class="border-b px-6 py-4">
				<Dialog.Title>{$form.id ? 'Editar Serviço' : 'Novo Serviço'}</Dialog.Title>
			</Dialog.Header>

			<form
				method="POST"
				action="/servicos?/upsert"
				class="flex flex-1 flex-col overflow-y-auto"
				use:enhance
			>
				<input type="hidden" name="id" bind:value={$form.id} />
				<div class="flex flex-col gap-5 px-6 py-5">
					{@render fields()}
				</div>
				<div class="border-t px-6 py-4">
					{@render submitButton()}
				</div>
			</form>
		</Dialog.Content>
	</Dialog.Root>
{:else}
	<Drawer.Root bind:open>
		<Drawer.Content>
			<Drawer.Header class="border-b text-left">
				<Drawer.Title>{$form.id ? 'Editar Serviço' : 'Novo Serviço'}</Drawer.Title>
			</Drawer.Header>

			<form
				method="POST"
				action="/servicos?/upsert"
				class="flex flex-col overflow-y-auto"
				use:enhance
			>
				<input type="hidden" name="id" bind:value={$form.id} />
				<div class="flex flex-col gap-5 px-4 py-5">
					{@render fields()}
				</div>
				<Drawer.Footer class="border-t">
					<Drawer.Close>
						{#snippet child({ props })}
							<Button {...props} variant="outline" class="w-full">Cancelar</Button>
						{/snippet}
					</Drawer.Close>
				</Drawer.Footer>
			</form>
		</Drawer.Content>
	</Drawer.Root>
{/if}
