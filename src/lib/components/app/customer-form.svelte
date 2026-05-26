<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { LoaderCircle } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import { enhance } from '$app/forms';

	let {
		open = $bindable(false),
		initialData = { id: '', name: '', phone: '' },
		onSuccess
	} = $props<{
		open: boolean;
		initialData?: { id?: string; name: string; phone: string };
		onSuccess?: (data: any) => void;
	}>();

	let isLoading = $state(false);
	let formState = $state({ id: '', name: '', phone: '' });
	let phoneDisplay = $state('');

	// Sincroniza o estado local quando o modal abre
	$effect(() => {
		if (open) {
			formState = { ...initialData };
			phoneDisplay = formatPhone(initialData.phone || '');
		} else {
			formState = { id: '', name: '', phone: '' };
			phoneDisplay = '';
		}
	});

	function handlePhoneInput(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		let val = input.value.replace(/\D/g, '').slice(0, 11);
		formState.phone = val;
		input.value = formatPhone(val);
	}

	function formatPhone(v: string) {
		if (!v) return '';
		let val = v.replace(/\D/g, '');
		if (val.length > 7) return `(${val.slice(0, 2)}) ${val.slice(2, 7)}-${val.slice(7)}`;
		if (val.length > 2) return `(${val.slice(0, 2)}) ${val.slice(2)}`;
		return val;
	}

	function tratarNomeInput(e: Event) {
		const target = e.target as HTMLInputElement;

		let valor = target.value;

		// 1. Impede espaços no início do texto
		valor = valor.replace(/^\s+/, '');

		// 2. Impede espaços duplos ou múltiplos no meio do texto
		valor = valor.replace(/\s{2,}/g, ' ');

		// 3. Mantém apenas letras, espaços, acentos pt-BR e os acentos isolados
		valor = valor.replace(/[^a-zA-ZÀ-ÿ\s~^´`]/g, '');

		formState.name = valor;
		target.value = valor;
	}

	function limparNomeNoBlur() {
		// Remove acentos isolados, remove espaços extras no final e mantém o valor limpo
		formState.name = formState.name.replace(/[~^´`]/g, '').trim();
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>{formState.id ? 'Editar Cliente' : 'Novo Cliente'}</Dialog.Title>
		</Dialog.Header>

		<form
			method="POST"
			action="/clientes?/upsert"
			class="grid gap-4 pt-4"
			use:enhance={() => {
				isLoading = true;
				return async ({ result }) => {
					isLoading = false;
					if (result.type === 'success') {
						toast.success('Salvo com sucesso!');
						onSuccess?.(result.data);
						open = false;
					} else {
						toast.error('Ocorreu um erro ao salvar.');
					}
				};
			}}
		>
			<input type="hidden" name="id" value={formState.id} />

			<div class="grid gap-2">
				<Label for="name">Nome</Label>
				<Input
					id="name"
					name="name"
					value={formState.name}
					oninput={tratarNomeInput}
					onblur={limparNomeNoBlur}
					maxlength={100}
					required
				/>
			</div>

			<div class="grid gap-2">
				<Label for="phone">Telefone (com DDD)</Label>
				<Input
					id="phone"
					type="text"
					inputmode="numeric"
					placeholder="(11) 99999-9999"
					value={formatPhone(formState.phone)}
					oninput={handlePhoneInput}
					required
				/>
				<input type="hidden" name="phone" value={formState.phone} />
			</div>

			<Dialog.Footer>
				<Button type="submit" disabled={isLoading}>
					{#if isLoading}
						<LoaderCircle class="mr-2 h-4 w-4 animate-spin" />
						Salvando
					{:else}
						Salvar
					{/if}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
