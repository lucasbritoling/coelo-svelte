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
		XCircle
	} from '@lucide/svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Switch } from '$lib/components/ui/switch';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';

	let { data } = $props();

	// ── Rotina semanal ─────────────────────────────────────────────
	let localDays = $state(data.workingHours.map((d: any) => ({ ...d })));
	$effect(() => {
		localDays = data.workingHours.map((d: any) => ({ ...d }));
	});
	let isSavingSchedule = $state(false);

	// ── Exceções ───────────────────────────────────────────────────
	let dialogOpen = $state(false);
	let dialogMode = $state<'new' | 'edit'>('new');
	let editingOverride = $state<any>(null);
	let isAvailable = $state(true);
	let isSavingOverride = $state(false);
	let isDeletingOverride = $state(false);

	function openNewDialog() {
		dialogMode = 'new';
		editingOverride = null;
		isAvailable = true;
		dialogOpen = true;
	}

	function openEditDialog(override: any) {
		dialogMode = 'edit';
		editingOverride = { ...override };
		isAvailable = override.is_available;
		dialogOpen = true;
	}

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
	function handleTimeInput(e: Event, day: any, field: 'start_time' | 'end_time') {
		const input = e.target as HTMLInputElement;
		let value = input.value.replace(/\D/g, ''); // Remove tudo que não é número

		if (value.length >= 3) {
			value = value.slice(0, 2) + ':' + value.slice(2, 4);
		}

		day[field] = value;
	}
</script>

<!-- ═══════════════════════════════════════════════════
     MOBILE
════════════════════════════════════════════════════ -->
<div class="flex min-h-screen flex-col bg-[#fafafa] sm:hidden dark:bg-zinc-950">
	<header
		class="top-0 z-30 flex items-center justify-between border-b bg-background/80 px-5 py-4 backdrop-blur-md"
	>
		<div>
			<h1 class="text-xl font-extrabold tracking-tight">Horários</h1>
			<p class="text-[11px] font-medium tracking-wider text-muted-foreground/80 uppercase">
				Configurações de Agenda
			</p>
		</div>

		<form
			method="POST"
			action="?/updateWorkingDay"
			use:enhance={({ formData }) => {
				isSavingSchedule = true;
				localDays.forEach((day, i) => {
					formData.append(`days[${i}][id]`, day.id);
					formData.append(`days[${i}][is_active]`, day.is_active ? '1' : '0');
					formData.append(`days[${i}][start_time]`, day.start_time ?? '');
					formData.append(`days[${i}][end_time]`, day.end_time ?? '');
				});
				return async ({ update }) => {
					await update({ invalidateAll: true });
					isSavingSchedule = false;
					toast.success('Alterações salvas');
				};
			}}
		>
			<Button
				type="submit"
				disabled={isSavingSchedule}
				size="sm"
				class="h-9 rounded-full px-4 font-bold transition-all active:scale-95"
			>
				{#if isSavingSchedule}
					<LoaderCircle class="size-4 animate-spin" />
				{:else}
					<Save class="mr-1.5 size-4" />
					Salvar
				{/if}
			</Button>
		</form>
	</header>

	<main class="flex flex-col gap-8 p-5 pb-32">
		<section>
			<div class="mb-3 flex items-center justify-between px-1">
				<h2 class="text-[11px] font-bold tracking-widest text-muted-foreground uppercase">
					Rotina Semanal
				</h2>
			</div>

			<div class="rounded-xl border bg-card divide-y divide-border overflow-hidden shadow-inner">
    {#each localDays as day (day.id)}
        <div class="flex items-center p-3.5 transition-colors gap-x-2 {day.is_active ? 'bg-transparent' : 'bg-muted/30'}">
            
            <div class="flex items-center gap-2.5 shrink-0">
                <Switch 
                    id="switch-{day.id}"
                    checked={day.is_active} 
                    onCheckedChange={(v) => (day.is_active = v)} 
                    class="scale-95"
                />
                <label for="switch-{day.id}" class="text-[13px] font-bold capitalize min-w-[36px] text-zinc-900 dark:text-white">
                    {new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(new Date(2024, 0, day.day_of_week + 1)).replace('.', '')}
                </label>
            </div>

            <div class="flex-1 flex items-center justify-end gap-x-1.5 transition-opacity duration-200 {day.is_active ? 'opacity-100' : 'opacity-0 pointer-events-none'}">
                <Input 
                    type="text"
                    inputmode="numeric"
                    placeholder="00:00"
                    value={day.start_time}
                    oninput={(e) => handleTimeInput(e, day, 'start_time')}
                    class="h-9 w-[70px] text-center text-sm font-semibold rounded-lg bg-zinc-50 dark:bg-zinc-900 border-muted-foreground/10 px-0 shadow-sm focus:border-primary/30 focus:ring-1 focus:ring-primary/20"
                    maxlength={5}
                />
                
                <span class="text-[10px] font-medium text-muted-foreground/50 shrink-0">às</span>

                <Input 
                    type="text"
                    inputmode="numeric"
                    placeholder="00:00"
                    value={day.end_time}
                    oninput={(e) => handleTimeInput(e, day, 'end_time')}
                    class="h-9 w-[70px] text-center text-sm font-semibold rounded-lg bg-zinc-50 dark:bg-zinc-900 border-muted-foreground/10 px-0 shadow-sm focus:border-primary/30 focus:ring-1 focus:ring-primary/20"
                    maxlength={5}
                />
            </div>
        </div>
    {/each}
</div>
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
							onclick={() => openEditDialog(override)}
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
									{#if override.is_available}
										<span class="font-semibold text-green-600"
											>{override.start_time.slice(0, 5)} – {override.end_time.slice(0, 5)}</span
										>
									{:else}
										Indisponível
									{/if}
									{#if override.note}
										· <span class="text-[11px] font-normal italic">"{override.note}"</span>{/if}
								</p>
							</div>

							<Pencil class="size-4 text-muted-foreground/50" />
						</button>
					{/each}
				</div>
			{/if}
		</section>
	</main>

	<button
		onclick={openNewOverrideDialog}
		class="fixed right-6 bottom-6 z-40 flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform active:scale-90"
	>
		<Plus class="size-6" />
	</button>
</div>

<!-- FAB mobile -->
<button
	onclick={openNewDialog}
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
	<!-- Sticky header -->
	<header
		class="top-0 z-20 flex items-center justify-between gap-4 border-b bg-background/95 px-6 py-4 backdrop-blur-sm"
	>
		<div>
			<h1 class="text-xl leading-none font-bold tracking-tight">Horários</h1>
			<p class="mt-0.5 text-xs text-muted-foreground">Rotina semanal e datas excepcionais</p>
		</div>
		<form
			method="POST"
			action="?/updateWorkingDay"
			use:enhance={({ formData }) => {
				isSavingSchedule = true;
				localDays.forEach((day: any, i: number) => {
					formData.append(`days[${i}][id]`, day.id);
					formData.append(`days[${i}][is_active]`, day.is_active ? '1' : '0');
					formData.append(`days[${i}][start_time]`, day.start_time ?? '');
					formData.append(`days[${i}][end_time]`, day.end_time ?? '');
				});
				return async ({ update }) => {
					await update({ invalidateAll: true });
					isSavingSchedule = false;
					toast.success('Horários salvos');
				};
			}}
		>
			<Button type="submit" size="sm" disabled={isSavingSchedule} class="gap-2 font-semibold">
				{#if isSavingSchedule}
					<LoaderCircle class="size-4 animate-spin" />
				{:else}
					<Save class="size-4" />
				{/if}
				Salvar alterações
			</Button>
		</form>
	</header>

	<!-- Grid principal -->
	<div class="flex-1 p-6">
		<div class="mx-auto grid max-w-4xl grid-cols-5 gap-6">
			<!-- Rotina semanal -->
			<div class="col-span-3 space-y-3">
				<p class="px-1 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
					Rotina Semanal
				</p>
				<div class="divide-y overflow-hidden rounded-2xl border bg-background">
					{#each localDays as day (day.id)}
						<div class="flex items-center gap-4 px-5 py-3">
							<Switch checked={day.is_active} onCheckedChange={(v) => (day.is_active = v)} />
							<span class="w-32 text-sm font-medium">{DAYS_FULL[day.day_of_week]}</span>
							<div
								class="flex flex-1 items-center gap-2 {!day.is_active
									? 'pointer-events-none opacity-30'
									: ''}"
							>
								<Input
									type="time"
									bind:value={day.start_time}
									class="h-8 flex-1  text-sm"
									disabled={!day.is_active}
								/>
								<span class="text-xs text-muted-foreground">–</span>
								<Input
									type="time"
									bind:value={day.end_time}
									class="h-8 flex-1  text-sm"
									disabled={!day.is_active}
								/>
							</div>
							{#if !day.is_active}
								<span class="ml-auto text-xs text-muted-foreground">Fechado</span>
							{/if}
						</div>
					{/each}
				</div>
			</div>

			<!-- Exceções -->
			<div class="col-span-2 space-y-3">
				<p class="px-1 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
					Próximas Exceções
				</p>

				<Button
					onclick={openNewDialog}
					variant="outline"
					class="h-9 w-full gap-2 border-dashed text-sm font-medium"
				>
					<Plus class="size-4" />
					Nova Exceção
				</Button>

				{#if data.overrides.length === 0}
					<div class="flex flex-col items-center gap-2 rounded-2xl border bg-background py-10">
						<CalendarX class="size-7 text-muted-foreground/30" />
						<p class="text-xs text-muted-foreground italic">Nenhuma exceção futura.</p>
					</div>
				{:else}
					<div class="divide-y overflow-hidden rounded-2xl border bg-background">
						{#each data.overrides as override (override.id)}
							<div class="group flex items-center gap-3 px-4 py-3">
								{#if override.is_available}
									<CalendarCheck class="size-4 shrink-0 text-green-500" />
								{:else}
									<CalendarX class="size-4 shrink-0 text-destructive" />
								{/if}
								<div class="min-w-0 flex-1">
									<p class="truncate text-sm font-semibold capitalize">{fmtDate(override.date)}</p>
									<p class="truncate text-[11px] text-muted-foreground">
										{#if override.is_available}
											{override.start_time.slice(0, 5)} – {override.end_time.slice(0, 5)}
										{:else}
											Indisponível{override.start_time
												? ` · ${override.start_time.slice(0, 5)}–${override.end_time.slice(0, 5)}`
												: ''}
										{/if}
										{#if override.note}<span class="italic"> · {override.note}</span>{/if}
									</p>
								</div>
								<button
									type="button"
									onclick={() => openEditDialog(override)}
									class="flex size-7 items-center justify-center rounded-md text-muted-foreground
										opacity-0 transition-all
										group-hover:opacity-100 hover:bg-muted hover:text-foreground"
									aria-label="Editar"
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

<!-- ═══════════════════════════════════════════════════
     DIALOG UNIFICADO — Nova / Editar Exceção
════════════════════════════════════════════════════ -->
<Dialog.Root bind:open={dialogOpen}>
	<Dialog.Content class="w-[calc(100vw-2rem)] gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-sm">
		<!-- Header do dialog -->
		<div class="border-b px-5 pt-5 pb-4">
			<Dialog.Title class="text-base font-bold">
				{dialogMode === 'edit' ? 'Editar Exceção' : 'Nova Exceção'}
			</Dialog.Title>
			<Dialog.Description class="mt-0.5 text-xs text-muted-foreground">
				{#if dialogMode === 'edit' && editingOverride}
					{fmtDateLong(editingOverride.date)}
				{:else}
					Feriado, folga ou horário especial.
				{/if}
			</Dialog.Description>
		</div>

		<!-- Formulário -->
		<form
			method="POST"
			action="?/upsertOverride"
			class="space-y-4 px-5 py-4"
			use:enhance={() => {
				isSavingOverride = true;
				return async ({ result, update }) => {
					await update({ invalidateAll: true });
					isSavingOverride = false;
					if (result.type === 'success') {
						toast.success(dialogMode === 'edit' ? 'Exceção atualizada' : 'Exceção criada');
						isAvailable = true;
						dialogOpen = false;
					}
				};
			}}
		>
			{#if dialogMode === 'edit'}
				<input type="hidden" name="id" value={editingOverride?.id} />
			{/if}

			<!-- Data -->
			<div class="grid gap-1.5">
				<Label class="text-xs font-semibold text-muted-foreground">Data</Label>
				<Input
					type="date"
					name="date"
					required
					value={dialogMode === 'edit' ? editingOverride?.date : ''}
					class="h-9"
				/>
			</div>

			<!-- Disponibilidade (switch colorido) -->
			<div
				class="flex items-center justify-between gap-3 rounded-xl border p-3 transition-colors
				{isAvailable
					? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30'
					: 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30'}"
			>
				<div class="flex items-center gap-2.5">
					{#if isAvailable}
						<CheckCircle2 class="size-4 shrink-0 text-green-600" />
						<span class="text-sm font-semibold text-green-800 dark:text-green-300">Disponível</span>
					{:else}
						<XCircle class="size-4 shrink-0 text-red-600" />
						<span class="text-sm font-semibold text-red-800 dark:text-red-300">Indisponível</span>
					{/if}
				</div>
				<input type="hidden" name="is_available" value={isAvailable ? 'on' : ''} />
				<Switch checked={isAvailable} onCheckedChange={(v) => (isAvailable = v)} />
			</div>

			<!-- Horários — sempre visíveis -->
			<div class="grid grid-cols-2 gap-3">
				<div class="grid gap-1.5">
					<Label class="text-xs font-semibold text-muted-foreground">Início</Label>
					<Input
						type="time"
						name="start_time"
						class="h-9  text-sm"
						value={dialogMode === 'edit' ? (editingOverride?.start_time?.slice(0, 5) ?? '') : ''}
					/>
				</div>
				<div class="grid gap-1.5">
					<Label class="text-xs font-semibold text-muted-foreground">Término</Label>
					<Input
						type="time"
						name="end_time"
						class="h-9  text-sm"
						value={dialogMode === 'edit' ? (editingOverride?.end_time?.slice(0, 5) ?? '') : ''}
					/>
				</div>
			</div>

			<!-- Observação -->
			<div class="grid gap-1.5">
				<Label class="text-xs font-semibold text-muted-foreground">
					Observação <span class="font-normal opacity-60">(opcional)</span>
				</Label>
				<Input
					name="note"
					placeholder="Ex: Feriado Municipal"
					class="h-9"
					value={dialogMode === 'edit' ? (editingOverride?.note ?? '') : ''}
				/>
			</div>

			<!-- Botão salvar -->
			<Button type="submit" disabled={isSavingOverride} class="h-9 w-full font-semibold">
				{#if isSavingOverride}
					<LoaderCircle class="mr-2 size-4 animate-spin" />Salvando...
				{:else}
					{dialogMode === 'edit' ? 'Atualizar' : 'Salvar Exceção'}
				{/if}
			</Button>
		</form>

		<!-- Excluir (somente modo edição) -->
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
							toast.success('Exceção excluída');
						};
					}}
				>
					<input type="hidden" name="id" value={editingOverride?.id} />
					<Button
						type="submit"
						variant="ghost"
						disabled={isDeletingOverride}
						class="h-8 w-full gap-1.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
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
