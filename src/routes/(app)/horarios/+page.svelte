<script lang="ts">
	import {
		Plus,
		Trash2,
		CalendarX,
		CalendarCheck,
		LoaderCircle,
		Pencil,
		Save,
		CheckCircle2,
		XCircle,
		Utensils
	} from '@lucide/svelte';
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

	// ── Rotina semanal ─────────────────────────────────────────────
	const mapDays = (days: WorkingDay[]) =>
		days
			.map((d) => ({
				...d,
				start_time: d.start_time?.slice(0, 5) ?? '09:00',
				end_time: d.end_time?.slice(0, 5) ?? '18:00'
			}))
			.sort((a, b) => a.day_of_week - b.day_of_week);

	// 2. Inicialize o estado diretamente
	let localDays = $state(mapDays(data.workingHours));

	let localLunch = $state({
		has_lunch: data.user?.has_lunch ?? false,
		lunch_start: data.user?.lunch_start?.slice(0, 5) ?? '12:00',
		lunch_end: data.user?.lunch_end?.slice(0, 5) ?? '13:00'
	});
	let isSavingLunch = $state(false);
	let isSavingSchedule = $state(false);

	const submitSchedule = ({ formData }: { formData: FormData }) => {
		isSavingSchedule = true;

		// Centraliza a construção do payload
		localDays.forEach((day, i) => {
			formData.append(`days[${i}][id]`, day.id);
			formData.append(`days[${i}][is_active]`, day.is_active ? '1' : '0');
			formData.append(`days[${i}][start_time]`, day.start_time);
			formData.append(`days[${i}][end_time]`, day.end_time);
		});

		return async ({ result, update }: any) => {
			isSavingSchedule = false;
			if (result.type === 'success') {
				toast.success('Agenda atualizada!');
				await update({ invalidateAll: true });
			}
		};
	};

	// ── Exceções ───────────────────────────────────────────────────
	let dialogOpen = $state(false);
	let isSavingOverride = $state(false);
	let isDeletingOverride = $state(false);

	const DAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
	const DAYS_FULL = [
		'Domingo',
		'Segunda-feira',
		'Terça-feira',
		'Quarta-feira',
		'Quinta-feira',
		'Sexta-feira',
		'Sábado'
	];

	// Estado único para o formulário de exceções
	let overrideForm = $state({
		id: null as string | null,
		date: '',
		is_available: true,
		start_time: '09:00',
		end_time: '18:00',
		note: ''
	});

	// Derivamos o modo do diálogo baseados na presença de um ID
	let dialogMode = $derived(overrideForm.id ? 'edit' : 'new');

	function openDialog(override?: any) {
		if (override) {
			// Modo Edição: Popula com dados existentes
			overrideForm = {
				id: override.id,
				date: override.date,
				is_available: override.is_available,
				start_time: override.start_time?.slice(0, 5) ?? '09:00',
				end_time: override.end_time?.slice(0, 5) ?? '18:00',
				note: override.note ?? ''
			};
		} else {
			// Modo Novo: Reseta para o padrão
			overrideForm = {
				id: null,
				date: new Date().toISOString().split('T')[0], // Data de hoje como sugestão
				is_available: false, // Geralmente exceção é para fechar o dia
				start_time: '09:00',
				end_time: '18:00',
				note: ''
			};
		}
		dialogOpen = true;
	}

	function fmtDate(dateStr: string) {
		return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR', {
			weekday: 'short',
			day: '2-digit',
			month: 'short'
		});
	}

	function fmtDateLong(dateStr: string) {
		return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR', {
			weekday: 'long',
			day: '2-digit',
			month: 'long'
		});
	}
	function handleTimeInput(e: Event, day: WorkingDay, field: 'start_time' | 'end_time') {
		const input = e.target as HTMLInputElement;
		let value = input.value.replace(/\D/g, ''); // Remove tudo que não é número

		if (value.length >= 3) {
			value = value.slice(0, 2) + ':' + value.slice(2, 4);
		}

		day[field] = value;
	}
</script>

<!-- SNIPPET DIAS DA ROTINA SEMANAL -->

{#snippet dayRow(day: WorkingDay, isDesktop = false)}
	<div
		class="flex items-center gap-x-3 p-3.5 transition-colors {day.is_active
			? 'bg-transparent'
			: 'bg-muted/30'}"
	>
		<div class="flex shrink-0 items-center gap-2.5">
			<Switch
				id="switch-{day.id}"
				checked={day.is_active}
				onCheckedChange={(v) => (day.is_active = v)}
				class="scale-95 cursor-pointer"
			/>
			<label
				for="switch-{day.id}"
				class="min-w-[40px] text-[13px] font-bold text-zinc-900 capitalize sm:w-28 sm:text-sm dark:text-white"
			>
				{new Intl.DateTimeFormat('pt-BR', { weekday: isDesktop ? 'long' : 'short' })
					.format(new Date(2025, 0, 5 + day.day_of_week))
					.replace('.', '')}
			</label>
		</div>

		<div class="relative flex h-9 flex-1 items-center justify-end">
			{#if day.is_active}
				<div class="flex animate-in items-center gap-x-1.5 transition-all fade-in">
					<Input
						type="text"
						inputmode="numeric"
						placeholder="00:00"
						value={day.start_time}
						oninput={(e) => handleTimeInput(e, day, 'start_time')}
						class="h-9 w-[70px] rounded-lg border-muted-foreground/10 bg-zinc-50 px-0 text-center text-sm font-semibold shadow-sm sm:w-20 dark:bg-zinc-900"
						maxlength={5}
					/>
					<span class="shrink-0 text-[8.5px] font-bold text-muted-foreground/40 uppercase">às</span>
					<Input
						type="text"
						inputmode="numeric"
						placeholder="00:00"
						value={day.end_time}
						oninput={(e) => handleTimeInput(e, day, 'end_time')}
						class="h-9 w-[70px] rounded-lg border-muted-foreground/10 bg-zinc-50 px-0 text-center text-sm font-semibold shadow-sm sm:w-20 dark:bg-zinc-900"
						maxlength={5}
					/>
				</div>
			{/if}
		</div>
	</div>
{/snippet}

<!-- SNIPPET INTERVALO ALMOÇO -->

{#snippet lunchFormSection()}
	<div class="mb-3 flex items-center justify-between px-1">
		<h2 class="text-[11px] font-bold tracking-widest text-muted-foreground uppercase">
			Intervalo de Almoço
		</h2>

		<form
			method="POST"
			action="?/updateLunchTime"
			use:enhance={({ formData }) => {
				isSavingLunch = true;
				formData.set('has_lunch', localLunch.has_lunch ? 'true' : 'false');
				formData.set('lunch_start', localLunch.lunch_start);
				formData.set('lunch_end', localLunch.lunch_end);

				return async ({ result, update }) => {
					isSavingLunch = false;
					if (result.type === 'success') {
						toast.success('Almoço atualizado!');
						await update({ invalidateAll: true });
					}
				};
			}}
		>
			<Button
				type="submit"
				size="sm"
				disabled={isSavingLunch}
				class="h-8 w-24 rounded-lg px-3 text-[11px] font-bold transition-all active:scale-95"
			>
				{#if isSavingLunch}
					<LoaderCircle class="mr-1 size-3 animate-spin" />
					Salvando
				{:else}
					Salvar
				{/if}
			</Button>
		</form>
	</div>

	<div class="rounded-xl border bg-card p-4 shadow-sm">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-3">
				<div
					class="flex size-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-950/30"
				>
					<Utensils class="size-5" />
				</div>
				<div class="space-y-0.5">
					<p class="text-[13px] font-bold text-zinc-900 dark:text-white">Pausa Diária</p>
					<p class="text-[11px] text-muted-foreground">Horário fixo de intervalo.</p>
				</div>
			</div>
			<Switch
				checked={localLunch.has_lunch}
				onCheckedChange={(v) => (localLunch.has_lunch = v)}
				class="scale-95 cursor-pointer"
			/>
		</div>

		{#if localLunch.has_lunch}
			<div
				class="mt-4 flex animate-in items-center gap-2 border-t pt-4 duration-200 fade-in slide-in-from-top-1"
			>
				<div class="flex flex-1 items-center gap-2">
					<Input
						type="time"
						bind:value={localLunch.lunch_start}
						class="h-9 flex-1 rounded-lg border-muted-foreground/10 bg-zinc-50 text-center text-sm font-semibold shadow-sm dark:bg-zinc-900"
					/>
					<span class="text-center text-[10px] font-bold text-muted-foreground/40 uppercase"
						>até</span
					>
					<Input
						type="time"
						bind:value={localLunch.lunch_end}
						class="h-9 flex-1 rounded-lg border-muted-foreground/10 bg-zinc-50 text-center text-sm font-semibold shadow-sm dark:bg-zinc-900"
					/>
				</div>
			</div>
		{/if}
	</div>
{/snippet}

<!-- ═══════════════════════════════════════════════════
     MOBILE
════════════════════════════════════════════════════ -->
<div class="flex min-h-screen flex-col bg-[#fafafa] sm:hidden dark:bg-zinc-950">
	<main class="flex flex-col gap-8 p-5 pb-32">
		<section>
			<div class="mb-3 flex items-center justify-between px-1">
				<h2 class="text-[11px] font-bold tracking-widest text-muted-foreground uppercase">
					Rotina Semanal
				</h2>

				<form method="POST" action="?/updateWorkingDay" use:enhance={submitSchedule}>
					<Button
						type="submit"
						size="sm"
						disabled={isSavingSchedule}
						class="h-8 w-24 rounded-lg px-3 text-[11px] font-bold transition-all active:scale-95"
					>
						{#if isSavingSchedule}
							<LoaderCircle class="mr-1 size-3 animate-spin" />
							Salvando
						{:else}
							Salvar
						{/if}
					</Button>
				</form>
			</div>

			<div class="divide-y divide-border overflow-hidden rounded-xl border bg-card shadow-inner">
				{#each localDays as day (day.id)}
					{@render dayRow(day, false)}
				{/each}
			</div>
		</section>

		<section>
			{@render lunchFormSection()}
		</section>

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

<!-- FAB mobile -->
<button
	onclick={() => openDialog()}
	class="fixed z-30 flex items-center gap-2 rounded-full bg-primary px-5 py-3.5 text-sm
		font-semibold text-primary-foreground shadow-[0_4px_24px_rgba(0,0,0,0.18)]
		transition-transform active:scale-95 sm:hidden"
	style="bottom: calc(4rem + env(safe-area-inset-bottom) + 1rem); right: 1rem;"
>
	<Plus class="size-4" />
	Nova Exceção
</button>

<!-- ═══════════════════════════════════════════════════
     DESKTOP
════════════════════════════════════════════════════ -->
<div class="hidden min-h-full sm:flex sm:flex-col">
	<div class="flex-1 p-6">
		<div class="mx-auto grid max-w-4xl grid-cols-5 gap-8">
			<div class="col-span-3">
				<div class="overflow-hidden rounded-2xl border bg-card shadow-sm">
					<div class="flex items-center justify-between border-b bg-muted/5 px-5 py-3">
						<p class="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
							Rotina Semanal
						</p>

						<form method="POST" action="?/updateWorkingDay" use:enhance={submitSchedule}>
							<Button
								type="submit"
								size="sm"
								disabled={isSavingSchedule}
								class="h-8 w-24 cursor-pointer rounded-lg px-4 text-xs font-bold transition-all active:scale-95"
							>
								{#if isSavingSchedule}
									<LoaderCircle class="mr-1.5 size-3.5 animate-spin" />
								{:else}
									Salvar
								{/if}
							</Button>
						</form>
					</div>

					<div class="divide-y divide-border">
						{#each localDays as day (day.id)}
							{@render dayRow(day, true)}
						{/each}
					</div>
				</div>
			</div>

			<div class="col-span-2 space-y-8">
				<section class="space-y-3">
					{@render lunchFormSection()}
				</section>

				<div class="space-y-3">
					<p class="px-1 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
						Próximas Exceções
					</p>

					<Button
						onclick={() => openDialog()}
						class="h-9 w-full cursor-pointer gap-2 bg-black text-sm font-medium text-white"
					>
						<Plus class="size-4" />
						Nova Exceção
					</Button>

					{#if data.overrides.length === 0}
						<div class="flex flex-col items-center gap-2 rounded-2xl border bg-background/50 py-10">
							<CalendarX class="size-7 text-muted-foreground/20" />
							<p class="px-4 text-center text-[11px] text-muted-foreground italic">
								Sem interrupções agendadas.
							</p>
						</div>
					{:else}
						<div class="divide-y overflow-hidden rounded-2xl border bg-card shadow-sm">
							{#each data.overrides as override (override.id)}
								<div
									class="group flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/30"
								>
									<div
										class="flex size-8 shrink-0 items-center justify-center rounded-lg {override.is_available
											? 'bg-green-100 text-green-600 dark:bg-green-950/40'
											: 'bg-red-100 text-red-600 dark:bg-red-950/40'}"
									>
										{#if override.is_available}
											<CalendarCheck class="size-4" />
										{:else}
											<CalendarX class="size-4" />
										{/if}
									</div>

									<div class="min-w-0 flex-1">
										<p class="truncate text-sm font-bold capitalize">{fmtDate(override.date)}</p>
										<p class="truncate text-[11px] font-medium text-muted-foreground">
											<span class={override.is_available ? 'text-green-600' : 'text-red-600'}>
												{override.start_time?.slice(0, 5)} – {override.end_time?.slice(0, 5)}
											</span>
											{#if override.note}<span class="text-muted-foreground/60 italic">
													· {override.note}</span
												>{/if}
										</p>
									</div>

									<button
										type="button"
										onclick={() => openDialog(override)}
										class="flex size-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground opacity-0 transition-all group-hover:opacity-100 hover:bg-muted hover:text-foreground"
									>
										<Pencil class="size-3.5" />
									</button>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>

<!-- ═══════════════════════════════════════════════════
     DIALOG UNIFICADO — Nova / Editar Exceção
════════════════════════════════════════════════════ -->
<Dialog.Root bind:open={dialogOpen}>
	<Dialog.Content class="w-[calc(100vw-2rem)] gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-sm">
		<div class="border-b px-5 pt-5 pb-4">
			<Dialog.Title class="text-base font-bold">
				{dialogMode === 'edit' ? 'Editar Exceção' : 'Nova Exceção'}
			</Dialog.Title>
			<Dialog.Description class="mt-0.5 text-xs text-muted-foreground">
				{#if dialogMode === 'edit'}
					{fmtDateLong(overrideForm.date)}
				{:else}
					Feriado, folga ou horário especial.
				{/if}
			</Dialog.Description>
		</div>

		<form
			method="POST"
			action="?/upsertOverride"
			class="space-y-4 px-5 py-4"
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

			<div class="grid gap-1.5">
				<Label class="text-xs font-semibold text-muted-foreground">Data</Label>
				<Input type="date" name="date" required bind:value={overrideForm.date} class="h-9" />
			</div>

			<div
				class="flex items-center justify-between gap-3 rounded-xl border p-3 transition-colors
    {overrideForm.is_available
					? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30'
					: 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30'}"
			>
				<div class="flex items-center gap-2.5">
					{#if overrideForm.is_available}
						<CheckCircle2 class="size-4 shrink-0 text-green-600" />
						<span class="text-sm font-semibold text-green-800 dark:text-green-300">Disponível</span>
					{:else}
						<XCircle class="size-4 shrink-0 text-red-600" />
						<span class="text-sm font-semibold text-red-800 dark:text-red-300">Indisponível</span>
					{/if}
				</div>

				{#if overrideForm.is_available}
					<input type="hidden" name="is_available" value="on" />
				{/if}

				<Switch bind:checked={overrideForm.is_available} class="cursor-pointer" />
			</div>

			<div class="grid grid-cols-2 gap-3">
				<div class="grid gap-1.5">
					<Label class="text-xs font-semibold text-muted-foreground">Início</Label>
					<Input
						type="time"
						name="start_time"
						bind:value={overrideForm.start_time}
						class="h-9 text-sm"
					/>
				</div>
				<div class="grid gap-1.5">
					<Label class="text-xs font-semibold text-muted-foreground">Término</Label>
					<Input
						type="time"
						name="end_time"
						bind:value={overrideForm.end_time}
						class="h-9 text-sm"
					/>
				</div>
			</div>

			<div class="grid gap-1.5">
				<Label class="text-xs font-semibold text-muted-foreground">Observação</Label>
				<Input
					name="note"
					placeholder="Ex: Feriado Municipal"
					bind:value={overrideForm.note}
					class="h-9"
				/>
			</div>

			<Button
				type="submit"
				disabled={isSavingOverride}
				class="h-9 w-full cursor-pointer font-semibold"
			>
				{#if isSavingOverride}
					<LoaderCircle class="mr-2 size-4 animate-spin" />Salvando...
				{:else}
					{dialogMode === 'edit' ? 'Atualizar' : 'Salvar Exceção'}
				{/if}
			</Button>
		</form>

		{#if dialogMode === 'edit'}
			<div class="px-5 pb-5">
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
						disabled={isDeletingOverride}
						class="h-8 w-full gap-1.5 text-xs text-destructive"
					>
						{#if isDeletingOverride}
							<LoaderCircle class="size-3.5 animate-spin" />
						{:else}
							<Trash2 class="size-3.5" />
						{/if}
						Excluir exceção
					</Button>
				</form>
			</div>
		{/if}
	</Dialog.Content>
</Dialog.Root>

<style>
	input::-webkit-calendar-picker-indicator {
		display: none;
		-webkit-appearance: none;
	}
</style>
