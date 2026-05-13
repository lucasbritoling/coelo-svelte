<script lang="ts">
	import { ui } from '$lib/state/ui.svelte';
	import {
		Plus,
		Trash2,
		CalendarX,
		CalendarCheck,
		LoaderCircle,
		Pencil,
		CheckCircle2,
		XCircle,
		Utensils,
		ChevronLeft,
		AlertTriangle
	} from '@lucide/svelte';
	import { goto, beforeNavigate } from '$app/navigation';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Switch } from '$lib/components/ui/switch';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import type { PageData } from './$types';

	interface WorkingDay {
		id: string;
		day_of_week: number;
		is_active: boolean;
		start_time: string;
		end_time: string;
	}

	let { data }: { data: PageData } = $props();

	// ── Sincronização de Estado ──────────────────────────────────
	const mapDays = (days: WorkingDay[]) =>
		days
			.map((d) => ({
				...d,
				start_time: d.start_time?.slice(0, 5) ?? '09:00',
				end_time: d.end_time?.slice(0, 5) ?? '18:00'
			}))
			.sort((a, b) => a.day_of_week - b.day_of_week);

	// Estados de referência para comparação (Dirty Check)
	let referenceDays = $state(mapDays(data.workingHours));
	let referenceLunch = $state({
		has_lunch: data.user?.has_lunch ?? false,
		lunch_start: data.user?.lunch_start?.slice(0, 5) ?? '12:00',
		lunch_end: data.user?.lunch_end?.slice(0, 5) ?? '13:00'
	});

	// Estados locais vinculados aos inputs
	let localDays = $state(mapDays(data.workingHours));
	let localLunch = $state({ ...referenceLunch });

	let isSavingLunch = $state(false);
	let isSavingSchedule = $state(false);

	// O Dialog só deve abrir se o estado ATUAL for diferente da REFERÊNCIA salva
	let isDirty = $derived(
		JSON.stringify(localDays) !== JSON.stringify(referenceDays) ||
			JSON.stringify(localLunch) !== JSON.stringify(referenceLunch)
	);

	// ── Interceptação de Navegação ────────────────────────────────
	let showExitDialog = $state(false);
	let pendingRoute = $state<string | null>(null);

	beforeNavigate(({ cancel, to }) => {
		if (isDirty && !isSavingSchedule && !isSavingLunch) {
			cancel();
			pendingRoute = to?.url.pathname ?? '/mais';
			showExitDialog = true;
		}
	});

	// ── Actions ───────────────────────────────────────────────────
	const submitSchedule = ({ formData }: { formData: FormData }) => {
		isSavingSchedule = true;
		localDays.forEach((day, i) => {
			formData.append(`days[${i}][id]`, day.id);
			formData.append(`days[${i}][is_active]`, day.is_active ? '1' : '0');
			formData.append(`days[${i}][start_time]`, day.start_time);
			formData.append(`days[${i}][end_time]`, day.end_time);
		});

		return async ({ result }: any) => {
			isSavingSchedule = false;
			if (result.type === 'success') {
				// Sincroniza a referência com o que foi salvo
				referenceDays = $state.snapshot(localDays);
				toast.success('Rotina atualizada!');
			}
		};
	};

	const submitLunch = ({ formData }: { formData: FormData }) => {
		isSavingLunch = true;
		formData.set('has_lunch', localLunch.has_lunch ? 'true' : 'false');
		formData.set('lunch_start', localLunch.lunch_start);
		formData.set('lunch_end', localLunch.lunch_end);

		return async ({ result }: any) => {
			isSavingLunch = false;
			if (result.type === 'success') {
				// Sincroniza a referência com o que foi salvo (Impede o Dialog)
				referenceLunch = $state.snapshot(localLunch);
				toast.success('Almoço atualizado!');
			}
		};
	};

	// ── Resto da Lógica (Exceções e Helpers) ──────────────────────
	let dialogOpen = $state(false);
	$effect(() => {
		ui.isModalOpen = dialogOpen || showExitDialog;
	});

	let isSavingOverride = $state(false);
	let overrideForm = $state({
		id: null as string | null,
		date: '',
		is_available: true,
		start_time: '09:00',
		end_time: '18:00',
		note: ''
	});

	function handleTimeInput(e: Event, day: any, field: string) {
		const input = e.target as HTMLInputElement;
		let value = input.value.replace(/\D/g, '');
		if (value.length >= 3) value = value.slice(0, 2) + ':' + value.slice(2, 4);
		day[field] = value;
	}

	let dialogMode = $derived(overrideForm.id ? 'edit' : 'new');
	let isDeletingOverride = $state(false);
	function openDialog(override?: any) {
		if (override) {
			overrideForm = {
				id: override.id,
				date: override.date,
				is_available: override.is_available,
				start_time: override.start_time?.slice(0, 5) ?? '09:00',
				end_time: override.end_time?.slice(0, 5) ?? '18:00',
				note: override.note ?? ''
			};
		} else {
			const now = new Date();
			const y = now.getFullYear();
			const m = String(now.getMonth() + 1).padStart(2, '0');
			const d = String(now.getDate()).padStart(2, '0');
			overrideForm = {
				id: null,
				date: `${y}-${m}-${d}`,
				is_available: false, // Por padrão indisp. para "folgas"
				start_time: '09:00',
				end_time: '18:00',
				note: ''
			};
		}
		dialogOpen = true;
	}
	function fmtDate(dateStr: string) {
		const date = new Date(dateStr + 'T00:00:00');
		return new Intl.DateTimeFormat('pt-BR', {
			weekday: 'long',
			day: 'numeric',
			month: 'long'
		}).format(date);
	}
</script>

<div class="flex h-full flex-col bg-[#F8F8F8]">
	<header class="flex flex-col gap-4 px-6 pt-8 pb-4">
		<div class="flex items-center gap-2">
			<button
				onclick={() => (isDirty ? (showExitDialog = true) : goto('/mais'))}
				class="-ml-2 flex items-center p-2 text-zinc-400 transition-transform active:scale-90"
			>
				<ChevronLeft size={24} strokeWidth={2.5} />
			</button>
			<h1 class="text-3xl font-semibold tracking-tight text-zinc-700">Horários</h1>
		</div>
		<p class="mt-1 text-sm text-zinc-500">Defina sua rotina e exceções de agenda.</p>
	</header>

	<main class="mx-auto w-full max-w-xl flex-1 space-y-10 px-4 pb-32">
		<!-- ROTINA SEMANAL -->
		<section>
			<div class="mb-4 flex items-center justify-between px-2">
				<h2 class="text-[11px] font-bold tracking-widest text-zinc-400 uppercase">
					Rotina Semanal
				</h2>
				<form method="POST" action="?/updateWorkingDay" use:enhance={submitSchedule}>
					<Button
						type="submit"
						disabled={isSavingSchedule}
						class="h-8 rounded-full bg-zinc-900 px-4 text-xs font-bold text-white"
					>
						{#if isSavingSchedule}
							<LoaderCircle class="mr-1.5 size-3 animate-spin" />
						{/if}
						Salvar Rotina
					</Button>
				</form>
			</div>

			<div class="overflow-hidden rounded-[24px] border border-zinc-100 bg-white shadow-sm">
				{#each localDays as day (day.id)}
					<div
						class="flex items-center justify-between border-b border-zinc-50 p-4 last:border-0 {day.is_active
							? ''
							: 'bg-zinc-50/50'}"
					>
						<div class="flex items-center gap-3">
							<Switch
								checked={day.is_active}
								onCheckedChange={(v) => (day.is_active = v)}
								class="scale-90"
							/>
							<span class="text-sm font-bold text-zinc-800 capitalize">
								{new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(
									new Date(2025, 0, 5 + day.day_of_week)
								)}
							</span>
						</div>
						{#if day.is_active}
							<div class="flex items-center gap-1.5">
								<Input
									type="text"
									inputmode="numeric"
									value={day.start_time}
									oninput={(e) => handleTimeInput(e, day, 'start_time')}
									class="h-9 w-[65px] border-zinc-100 bg-zinc-50 text-center text-sm font-bold"
									maxlength={5}
								/>
								<span class="text-[10px] font-bold text-zinc-300 uppercase">às</span>
								<Input
									type="text"
									inputmode="numeric"
									value={day.end_time}
									oninput={(e) => handleTimeInput(e, day, 'end_time')}
									class="h-9 w-[65px] border-zinc-100 bg-zinc-50 text-center text-sm font-bold"
									maxlength={5}
								/>
							</div>
						{:else}
							<span class="text-xs font-medium text-zinc-400 italic">Fechado</span>
						{/if}
					</div>
				{/each}
			</div>
		</section>

		<!-- ALMOÇO -->
		<section>
			<div class="mb-4 flex items-center justify-between px-2">
				<h2 class="text-[11px] font-bold tracking-widest text-zinc-400 uppercase">
					Intervalo de Almoço
				</h2>
				<form method="POST" action="?/updateLunchTime" use:enhance={submitLunch}>
					<Button
						type="submit"
						disabled={isSavingLunch}
						class="h-8 rounded-full bg-zinc-900 px-4 text-xs font-bold text-white"
					>
						{#if isSavingLunch}
							<LoaderCircle class="mr-1.5 size-3 animate-spin" />
						{/if}
						Salvar Almoço
					</Button>
				</form>
			</div>

			<div class="rounded-[24px] border border-zinc-100 bg-white p-5 shadow-sm">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-4">
						<div
							class="flex size-11 items-center justify-center rounded-full bg-orange-50 text-orange-500"
						>
							<Utensils size={20} />
						</div>
						<div>
							<p class="text-sm font-bold text-zinc-900">Pausa fixa</p>
							<p class="text-xs text-zinc-500">Horário diário de intervalo.</p>
						</div>
					</div>
					<Switch
						checked={localLunch.has_lunch}
						onCheckedChange={(v) => (localLunch.has_lunch = v)}
					/>
				</div>
				{#if localLunch.has_lunch}
					<div class="mt-5 flex items-center gap-3 border-t border-zinc-50 pt-5">
						<Input
							type="time"
							bind:value={localLunch.lunch_start}
							class="h-10 border-zinc-100 bg-zinc-50 text-center font-bold"
						/>
						<span class="text-[10px] font-bold text-zinc-300 uppercase">até</span>
						<Input
							type="time"
							bind:value={localLunch.lunch_end}
							class="h-10 border-zinc-100 bg-zinc-50 text-center font-bold"
						/>
					</div>
				{/if}
			</div>
		</section>
		<!-- EXCEÇÕES -->

		<section>
			<div class="mb-3 flex items-center justify-between px-1">
				<h2 class="text-[11px] font-bold tracking-widest text-muted-foreground uppercase">
					Próximas Exceções
				</h2>
			</div>

			{#if data.overrides.length === 0}
				<div
					class="flex flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-muted bg-background/50 px-6 py-12 text-center"
				>
					<div class="flex size-12 items-center justify-center rounded-full bg-muted">
						<CalendarX class="size-6 text-muted-foreground/50" />
					</div>
					<p class="text-sm font-medium text-muted-foreground">
						Sua agenda está seguindo a rotina padrão sem interrupções.
					</p>
				</div>
			{:else}
				<div class="divide-y overflow-hidden rounded-2xl border bg-card shadow-sm">
					{#each data.overrides as override (override.id)}
						<button
							type="button"
							onclick={() => openDialog(override)}
							class="flex w-full items-center gap-4 px-4 py-4 text-left transition-colors active:bg-muted/50"
						>
							<div
								class="flex size-10 shrink-0 items-center justify-center rounded-xl {override.is_available
									? 'bg-green-100 text-green-700'
									: 'bg-red-100 text-red-700'}"
							>
								{#if override.is_available}
									<CalendarCheck class="size-5" />
								{:else}
									<CalendarX class="size-5" />
								{/if}
							</div>

							<div class="min-w-0 flex-1">
								<p class="truncate text-sm font-bold capitalize">{fmtDate(override.date)}</p>
								<p class="text-xs font-medium text-muted-foreground">
									<span
										class="font-semibold {override.is_available
											? 'text-green-600 dark:text-green-500'
											: 'text-red-600 dark:text-red-500'}"
									>
										{override.start_time?.slice(0, 5) ?? '00:00'} – {override.end_time?.slice(
											0,
											5
										) ?? '00:00'}
									</span>

									{#if override.note}
										<span class="text-[11px] font-normal italic">"{override.note}"</span>
									{/if}
								</p>
							</div>

							<Pencil class="size-4 text-muted-foreground/50" />
						</button>
					{/each}
				</div>
			{/if}
		</section>
	</main>
</div>

<button
	onclick={() => openDialog()}
	class="fixed right-6 z-40 flex size-14 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-900 shadow-xl transition-transform active:scale-90"
	style="bottom: 100px"
>
	<Plus size={28} />
</button>

<Dialog.Root bind:open={dialogOpen}>
	<Dialog.Content class="w-[calc(100vw-2rem)] overflow-hidden rounded-[32px] p-0 sm:max-w-sm">
		<div class="border-b border-zinc-50 px-6 pt-6 pb-4">
			<Dialog.Title class="text-lg font-bold text-zinc-900">
				{dialogMode === 'edit' ? 'Editar Exceção' : 'Nova Exceção'}
			</Dialog.Title>
		</div>
		<form
			method="POST"
			action="?/upsertOverride"
			class="space-y-5 px-6 py-6 pt-0"
			use:enhance={() => {
				isSavingOverride = true;
				return async ({ result, update }) => {
					await update({ invalidateAll: true });
					isSavingOverride = false;
					if (result.type === 'success') dialogOpen = false;
				};
			}}
		>
			{#if overrideForm.id}
				<input type="hidden" name="id" value={overrideForm.id} />
			{/if}

			<div class="space-y-1.5">
				<Label class="text-[11px] font-bold text-zinc-400 uppercase">Data</Label>
				<Input
					type="date"
					name="date"
					required
					bind:value={overrideForm.date}
					class="h-11 rounded-xl border-zinc-100 bg-[#F8F8F8]"
				/>
			</div>

			<div
				class="flex items-center justify-between rounded-2xl border border-zinc-100 bg-[#F8F8F8]/50 p-4"
			>
				<span
					class="text-sm font-bold {overrideForm.is_available
						? 'text-emerald-700'
						: 'text-rose-700'}"
				>
					{overrideForm.is_available ? 'Disponível' : 'Indisponível'}
				</span>
				<Switch bind:checked={overrideForm.is_available} />
				{#if overrideForm.is_available}
					<input type="hidden" name="is_available" value="on" />
				{/if}
			</div>

			<div class="grid grid-cols-2 gap-4">
				<Input
					type="time"
					name="start_time"
					bind:value={overrideForm.start_time}
					class="h-11 rounded-xl border-zinc-100 bg-[#F8F8F8] font-bold"
				/>
				<Input
					type="time"
					name="end_time"
					bind:value={overrideForm.end_time}
					class="h-11 rounded-xl border-zinc-100 bg-[#F8F8F8] font-bold"
				/>
			</div>

			<div class="space-y-1.5">
				<Label class="text-[11px] font-bold text-zinc-400 uppercase">Observação</Label>
				<Input
					name="note"
					placeholder="Opcional..."
					bind:value={overrideForm.note}
					class="h-11 rounded-xl border-zinc-100 bg-[#F8F8F8]"
				/>
			</div>

			<Button
				type="submit"
				disabled={isSavingOverride}
				class="h-12 w-full rounded-2xl bg-zinc-900 font-bold text-white active:scale-95"
			>
				{isSavingOverride ? 'Salvando...' : 'Salvar Exceção'}
			</Button>

			{#if dialogMode === 'edit'}
				<!-- svelte-ignore node_invalid_placement_ssr -->
				<form
					method="POST"
					action="?/deleteOverride"
					use:enhance={() => {
						isDeletingOverride = true;
						return async ({ update }) => {
							await update({ invalidateAll: true });
							isDeletingOverride = false;
							dialogOpen = false;
						};
					}}
				>
					<input type="hidden" name="id" value={overrideForm.id} />
					<Button
						type="submit"
						variant="ghost"
						class="h-10 w-full text-xs font-bold text-rose-500 hover:bg-rose-50"
					>
						Excluir Exceção
					</Button>
				</form>
			{/if}
		</form>
	</Dialog.Content>
</Dialog.Root>

<!-- DIALOG: Alterações não salvas -->
<Dialog.Root bind:open={showExitDialog}>
	<Dialog.Content class="w-[calc(100vw-2rem)] rounded-[32px] p-6 sm:max-w-xs">
		<div class="flex flex-col items-center text-center">
			<div
				class="mb-4 flex size-16 items-center justify-center rounded-full bg-amber-50 text-amber-500"
			>
				<AlertTriangle size={32} />
			</div>
			<Dialog.Title class="text-lg font-bold text-zinc-900">Alterações pendentes</Dialog.Title>
			<Dialog.Description class="mt-2 text-sm text-zinc-500">
				Deseja salvar antes de sair ou descartar as mudanças?
			</Dialog.Description>
		</div>
		<div class="mt-6 flex flex-col gap-2">
			<Button
				class="h-12 w-full rounded-2xl bg-zinc-900 font-bold text-white"
				onclick={() => (showExitDialog = false)}
			>
				Continuar Editando
			</Button>

			<Button
				variant="ghost"
				class="h-12 w-full rounded-2xl font-bold text-rose-500 hover:bg-rose-50"
				onclick={async () => {
					// 1. Primeiro resetamos as referências para o estado local atual
					// Isso faz com que isDirty se torne 'false' imediatamente
					referenceDays = $state.snapshot(localDays);
					referenceLunch = $state.snapshot(localLunch);

					// 2. Fechamos o modal
					showExitDialog = false;

					// 3. Agora o goto não será mais interceptado pelo beforeNavigate
					if (pendingRoute) {
						await goto(pendingRoute);
					} else {
						await goto('/mais');
					}
				}}
			>
				Descartar e Sair
			</Button>
		</div>
	</Dialog.Content>
</Dialog.Root>

<style>
	:global(body) {
		background-color: #f8f8f8;
	}
	input::-webkit-calendar-picker-indicator {
		display: none;
	}
</style>
