<script lang="ts">
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { enhance } from '$app/forms';
	import { Camera, Loader2, Check, ChevronLeft } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';

	// Componentes importados do seu diretório UI
	import * as Avatar from '$lib/components/ui/avatar';
	import * as InputGroup from '$lib/components/ui/input-group';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';

	let { data, form } = $props();

	// Estados reativos mapeados com Runes do Svelte 5
	let fullName = $state(data.user?.full_name ?? '');
	let username = $state(data.user?.username ?? '');
	let address = $state(data.user?.address ?? '');
	let phone = $state(data.user?.phone ?? '');
	let email = $state(data.user?.email ?? '');
	let password = $state('');

	const avatarUrl = $derived(data.user?.avatar_url ?? '');
	let uploading = $state(false);
	let isSaving = $state(false);
	let saved = $state(false);

	$effect(() => {
		if (form?.success) {
			saved = true;
			toast.success('Perfil atualizado com sucesso!');
			password = '';
			setTimeout(() => (saved = false), 2500);
		} else if (form?.message) {
			toast.error(form.message);
		}
	});

	const initials = $derived(
		fullName
			.split(' ')
			.map((n: string) => n[0])
			.slice(0, 1)
			.join('')
			.toUpperCase() || '?'
	);

	function triggerFileInput() {
		document.getElementById('avatar-input')?.click();
	}
</script>

<div
	class="mx-auto max-w-2xl space-y-8 px-4 py-10 pt-8"
	in:fly={{ y: 20, duration: 260, easing: cubicOut }}
>
	<div class="flex items-center justify-between pb-0">
		<Button variant="ghost" size="icon" onclick={() => history.back()} aria-label="Voltar">
			<ChevronLeft size={18} strokeWidth={2} />
		</Button>
		<h1 class="text-lg font-semibold tracking-tight text-foreground">Editar Perfil</h1>
		<div class="w-9"></div>
	</div>

	<div class="flex flex-col items-center gap-4 py-0 sm:flex-row sm:gap-6">
		<form
			method="POST"
			action="?/updateAvatar"
			enctype="multipart/form-data"
			use:enhance={() => {
				uploading = true;
				return async ({ result, update }) => {
					if (result.type === 'error') toast.error('Erro crítico no servidor');
					if (result.type === 'failure')
						toast.error(`Erro: ${result.data?.message || 'Verifique o arquivo'}`);
					if (result.type === 'success') {
						// Aqui não passamos reset: false propositalmente para que o input de arquivo seja limpo
						await update();
					}
					uploading = false;
				};
			}}
		>
			<div class="relative flex h-24 w-24 shrink-0 overflow-visible">
				<Avatar.Root class="h-full w-full border">
					{#if uploading}
						<div class="flex h-full w-full items-center justify-center rounded-full bg-muted">
							<Loader2 size={24} class="animate-spin text-muted-foreground/50" />
						</div>
					{:else if avatarUrl}
						<Avatar.Image src={avatarUrl} alt={fullName} class="object-cover" />
					{:else}
						<Avatar.Fallback class="text-xl font-medium">{initials}</Avatar.Fallback>
					{/if}
				</Avatar.Root>

				<input
					id="avatar-input"
					type="file"
					name="avatar"
					accept="image/*"
					class="hidden"
					onchange={(e) => e.currentTarget.form?.requestSubmit()}
				/>

				<Button
					type="button"
					variant="outline"
					size="icon"
					class="absolute -right-1 -bottom-1 h-8 w-8 rounded-full shadow-sm"
					onclick={triggerFileInput}
					disabled={uploading}
					aria-label="Alterar foto"
				>
					<Camera size={16} strokeWidth={2.5} class="text-muted-foreground" />
				</Button>
			</div>
		</form>

		<div class="space-y-1 text-center sm:text-left">
			<h2 class="text-xl font-bold tracking-tight text-foreground">{fullName || 'Seu nome'}</h2>
			<p class="text-sm text-muted-foreground">
				<span class="opacity-60">coelo.dev/</span><span class="font-medium text-foreground"
					>{username || 'username'}</span
				>
			</p>
		</div>
	</div>

	<form
		method="POST"
		action="?/updateProfile"
		use:enhance={() => {
			isSaving = true;
			return async ({ result, update }) => {
				// reset: false impede que os inputs voltem ao valor inicial (vazio)
				await update({ reset: false });

				if (result.type === 'success') {
					// Sincroniza os estados locais com a resposta nova do +page.server.ts
					// Isso garante que formatações do servidor (ex: toLowerCase do username) reflitam na tela
					fullName = data.user?.full_name ?? '';
					username = data.user?.username ?? '';
					address = data.user?.address ?? '';
					phone = data.user?.phone ?? '';
					email = data.user?.email ?? '';
				}

				isSaving = false;
			};
		}}
		class="mx-auto w-full max-w-md"
	>
		<div class="space-y-5">
			<div class="grid gap-2">
				<div class="flex items-center justify-between">
					<Label for="fullName">Nome</Label>

					<Button
						type="submit"
						disabled={isSaving || saved}
						size="sm"
						class="h-7 px-3 text-xs font-medium transition-colors {saved
							? 'bg-emerald-600 text-white hover:bg-emerald-600'
							: ''}"
					>
						{#if isSaving}
							<Loader2 size={12} strokeWidth={2.5} class="animate-spin" />
							<span>Salvando</span>
						{:else if saved}
							<Check size={12} strokeWidth={2.5} />
							<span>Salvo!</span>
						{:else}
							<span>Salvar</span>
						{/if}
					</Button>
				</div>
				<Input
					id="fullName"
					name="fullName"
					type="text"
					bind:value={fullName}
					placeholder="Como você se chama?"
					required
				/>
			</div>

			<div class="grid gap-2">
				<Label for="username">Link da agenda</Label>
				<InputGroup.Root>
					<InputGroup.Text class="ml-2">coelo.dev/</InputGroup.Text>
					<InputGroup.Input
						id="username"
						name="username"
						type="text"
						bind:value={username}
						placeholder="seu-link"
						required
					/>
				</InputGroup.Root>
			</div>

			<div class="grid gap-2">
				<Label for="address">Endereço de Atendimento</Label>
				<Input
					id="address"
					name="address"
					type="text"
					bind:value={address}
					placeholder="Rua, Número, Sala ou 'Online'"
				/>
			</div>

			<div class="grid gap-2">
				<Label for="phone">Telefone / WhatsApp</Label>
				<Input
					id="phone"
					name="phone"
					type="tel"
					bind:value={phone}
					placeholder="(11) 99999-9999"
				/>
			</div>

			<div class="grid gap-2">
				<Label for="email">E-mail de Login</Label>
				<Input
					id="email"
					name="email"
					type="email"
					bind:value={email}
					placeholder="seu@email.com"
					required
				/>
			</div>

			<div class="grid gap-2 pb-20">
				<Label for="password">Nova Senha</Label>
				<Input
					id="password"
					name="password"
					type="password"
					bind:value={password}
					placeholder="Preencha apenas para alterar"
				/>
			</div>
		</div>
	</form>
</div>
