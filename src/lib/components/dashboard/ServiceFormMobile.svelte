<script lang="ts">
	import * as Drawer from '$lib/components/ui/drawer';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { toast } from 'svelte-sonner';
	import { Coffee, ChevronRight, ChevronLeft, LoaderCircle, Check } from '@lucide/svelte';
	import { tick } from 'svelte';
	import { invalidateAll } from '$app/navigation';

	let {
		service = null,
		open = $bindable(),
		initialName = '',
		onSuccess
	} = $props<{
		service?: any;
		open: boolean;
		initialName?: string;
		onSuccess?: (newService: any) => void;
	}>();

	let step = $state(1);
	let isLoading = $state(false);

	let name = $state('');
	let duration = $state(30);
	let min_notice_hours = $state(2);
	let buffer_after_min = $state(0);

	$effect(() => {
		if (open) {
			step = 1;
			name = service?.name ?? initialName ?? '';
			duration = service?.duration ?? 30;
			min_notice_hours = service?.min_notice_hours ?? 2;
			buffer_after_min = service?.buffer_after_min ?? 0;
		}
	});

	function canAdvance() {
		return name.trim().length > 0 && duration > 0;
	}

	function handleOpenChange(v: boolean) {
		open = v;
	}

	async function handleSubmit() {
		if (step === 1) {
			if (canAdvance()) step = 2;
			return;
		}
		isLoading = true;
		try {
			const res = await fetch('/servicos?/upsert', {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body: new URLSearchParams({
					...(service?.id ? { id: service.id } : {}),
					name,
					duration: String(duration),
					min_notice_hours: String(min_notice_hours),
					buffer_after_min: String(buffer_after_min)
				})
			});

			if (!res.ok) throw new Error();

			open = false;
			await tick();
			toast.success('Serviço guardado!');
			onSuccess?.(await res.json().catch(() => null));
			await invalidateAll();
		} catch {
			toast.error('Erro ao salvar serviço');
		} finally {
			isLoading = false;
		}
	}
</script>

<Drawer.Root bind:open onOpenChange={handleOpenChange}>
	<Drawer.Content
		style="max-height: 85svh; min-height: 60svh; display: flex; flex-direction: column; padding-bottom: env(safe-area-inset-bottom);"
		class="mx-auto max-w-md rounded-t-[20px] outline-none"
	>
		<!-- Handle -->
		<div class="mx-auto mt-2 mb-1 h-1 w-10 flex-shrink-0 rounded-full bg-border"></div>

		<!-- Cabeçalho fixo -->
		<div class="flex flex-shrink-0 items-center justify-between px-5 pt-2 pb-3">
			<div>
				<p class="text-[11px] font-medium tracking-widest text-muted-foreground uppercase">
					{service?.id ? 'Editar' : 'Novo'} serviço · {step}/2
				</p>
				<h2 class="text-lg leading-tight font-semibold">
					{step === 1 ? 'O que é o serviço?' : 'Regras de agendamento'}
				</h2>
			</div>
			<div class="flex gap-1.5">
				{#each [1, 2] as s}
					<div
						class="h-2 rounded-full transition-all duration-300 {s === step
							? 'w-5 bg-foreground'
							: s < step
								? 'w-2 bg-foreground/40'
								: 'w-2 bg-border'}"
					></div>
				{/each}
			</div>
		</div>

		<!-- Área scrollável -->
		<form
			onsubmit={(e) => {
				e.preventDefault();
				handleSubmit();
			}}
			style="overflow-y: auto; overscroll-behavior: contain; flex: 1 1 0; min-height: 0;"
			class="px-5"
		>
			<!-- ETAPA 1 -->
			{#if step === 1}
				<div class="flex flex-col gap-5 pb-6">
					<div class="flex flex-col gap-1.5">
						<label for="m-name" class="text-sm font-medium">Nome do serviço</label>
						<Input
							id="m-name"
							bind:value={name}
							placeholder="Ex: Corte de Cabelo"
							class="h-12 text-base"
							autocomplete="off"
							enterkeyhint="next"
							onkeydown={(e) => {
								if (e.key === 'Enter') {
									e.preventDefault();
									if (canAdvance()) step = 2;
								}
							}}
						/>
					</div>

					<div class="flex flex-col gap-1.5">
						<label class="text-sm font-medium">Duração</label>
						<div class="grid grid-cols-4 gap-2">
							{#each [15, 30, 45, 60] as preset}
								<button
									type="button"
									onclick={() => (duration = preset)}
									class="rounded-xl border py-3 text-sm font-semibold transition-all
										{duration === preset
										? 'border-foreground bg-foreground text-background'
										: 'border-border bg-muted/40 text-foreground'}"
								>
									{preset}min
								</button>
							{/each}
						</div>
						<div class="flex items-center gap-3">
							<button
								type="button"
								onclick={() => (duration = Math.max(5, duration - 5))}
								class="h-11 w-11 flex-shrink-0 rounded-xl border text-lg font-medium">−</button
							>
							<div class="flex-1 text-center text-base font-semibold">{duration} min</div>
							<button
								type="button"
								onclick={() => (duration = duration + 5)}
								class="h-11 w-11 flex-shrink-0 rounded-xl border text-lg font-medium">+</button
							>
						</div>
					</div>

					<Button
						type="button"
						class="h-12 w-full rounded-2xl text-base font-semibold"
						disabled={!canAdvance()}
						onclick={() => (step = 2)}
					>
						Continuar <ChevronRight class="ml-1 h-4 w-4" />
					</Button>
				</div>
			{/if}

			<!-- ETAPA 2 -->
			{#if step === 2}
				<div class="flex flex-col gap-4 pb-6">
					<div class="flex flex-col gap-2 rounded-2xl bg-muted/50 p-4">
						<label for="m-notice" class="text-sm font-medium">Antecedência mínima</label>
						<div class="grid grid-cols-3 gap-2">
							{#each [1, 2, 4] as h}
								<button
									type="button"
									onclick={() => (min_notice_hours = h)}
									class="rounded-xl border py-2.5 text-sm font-medium transition-all
										{min_notice_hours === h
										? 'border-foreground bg-foreground text-background'
										: 'border-border bg-background'}"
								>
									{h}h
								</button>
							{/each}
						</div>
						<Input
							id="m-notice"
							type="number"
							class="h-11"
							bind:value={min_notice_hours}
							placeholder="Outro valor em horas..."
						/>
						<p class="text-[11px] text-muted-foreground italic">
							Evita agendamentos de última hora.
						</p>
					</div>

					<div class="flex flex-col gap-2 rounded-2xl bg-muted/50 p-4">
						<label for="m-buffer" class="text-sm font-medium">Intervalo de respiro</label>
						<div class="grid grid-cols-3 gap-2">
							{#each [0, 10, 15] as b}
								<button
									type="button"
									onclick={() => (buffer_after_min = b)}
									class="rounded-xl border py-2.5 text-sm font-medium transition-all
										{buffer_after_min === b
										? 'border-foreground bg-foreground text-background'
										: 'border-border bg-background'}"
								>
									{b === 0 ? 'Nenhum' : `${b}min`}
								</button>
							{/each}
						</div>
						<div class="relative">
							<Coffee
								class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
							/>
							<Input
								id="m-buffer"
								type="number"
								class="h-11 pl-9"
								bind:value={buffer_after_min}
								placeholder="Outro valor em minutos..."
							/>
						</div>
						<p class="text-[11px] text-muted-foreground italic">
							Tempo livre após o serviço para limpeza/descanso.
						</p>
					</div>

					<div class="flex gap-3">
						<Button
							type="button"
							variant="outline"
							class="h-12 flex-1 rounded-2xl text-base"
							onclick={() => (step = 1)}
						>
							<ChevronLeft class="mr-1 h-4 w-4" /> Voltar
						</Button>
						<Button
							type="submit"
							class="h-12 flex-[2] rounded-2xl text-base font-semibold"
							disabled={isLoading}
						>
							{#if isLoading}
								<LoaderCircle class="mr-2 h-4 w-4 animate-spin" /> Salvando...
							{:else}
								<Check class="mr-1.5 h-4 w-4" />
								{service?.id ? 'Salvar' : 'Criar serviço'}
							{/if}
						</Button>
					</div>
				</div>
			{/if}
		</form>
	</Drawer.Content>
</Drawer.Root>
