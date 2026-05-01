<script lang="ts">
	import { Plus, Trash2, CalendarX, CalendarCheck, LoaderCircle, Clock } from '@lucide/svelte';
	import * as Drawer from '$lib/components/ui/drawer';
	import { Button } from '$lib/components/ui/button';
	import { Switch } from '$lib/components/ui/switch';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import { MediaQuery } from 'svelte/reactivity';

	let { data } = $props();

	const isDesktop = new MediaQuery('(min-width: 640px)');

	let isLoading = $state(false);
	let openOverrideForm = $state(false);
	let isAvailableOverride = $state(false);

	let saveTimeout: ReturnType<typeof setTimeout>;

	function handleTimeChange(e: Event, dayId: string, isActive: boolean) {
		const form = (e.currentTarget as HTMLInputElement).form;
		if (!form) return;
		clearTimeout(saveTimeout);
		saveTimeout = setTimeout(() => {
			const checkbox = document.getElementById(`check-${dayId}`) as HTMLInputElement;
			if (checkbox) checkbox.checked = isActive;
			form.requestSubmit();
		}, 1000);
	}

	const daysOfWeek = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

	const daysOfWeekFull = [
		'Domingo',
		'Segunda-feira',
		'Terça-feira',
		'Quarta-feira',
		'Quinta-feira',
		'Sexta-feira',
		'Sábado'
	];

	// ── Swipe-to-delete (exceções) ─────────────────────────────────
	let swipedId = $state<string | null>(null);
	let touching = $state(false);
	let touchStartX = 0;
	let touchStartY = 0;
	let lockAxis = $state<'h' | 'v' | null>(null);
	const SWIPE_OPEN_X = -80;
	const SWIPE_THRESHOLD = 52;

	function onTouchStart(e: TouchEvent, id: string) {
		if (swipedId && swipedId !== id) {
			swipedId = null;
			return;
		}
		touchStartX = e.touches[0].clientX;
		touchStartY = e.touches[0].clientY;
		lockAxis = null;
		touching = true;
	}
	function onTouchMove(e: TouchEvent) {
		const dx = e.touches[0].clientX - touchStartX;
		const dy = e.touches[0].clientY - touchStartY;
		if (!lockAxis) lockAxis = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v';
		if (lockAxis === 'h') e.preventDefault();
	}
	function onTouchEnd(e: TouchEvent, id: string) {
		touching = false;
		if (lockAxis !== 'h') return;
		const dx = e.changedTouches[0].clientX - touchStartX;
		if (dx < -SWIPE_THRESHOLD) swipedId = id;
		else if (dx > SWIPE_THRESHOLD / 2) swipedId = null;
		lockAxis = null;
	}
</script>

{#if swipedId}
	<div
		class="fixed inset-0 z-10"
		role="presentation"
		onclick={() => (swipedId = null)}
		ontouchstart={() => (swipedId = null)}
	></div>
{/if}

<!-- ─────────────────────── MOBILE ──────────────────────────────── -->
<div class="flex w-full flex-col gap-8 p-4 pb-28 sm:hidden">
	<div>
		<h1 class="text-2xl font-bold tracking-tight">Horários</h1>
		<p class="text-sm text-muted-foreground">Sua rotina semanal e datas excepcionais.</p>
	</div>

	<!-- Rotina Semanal -->
	<section class="space-y-3">
		<h2 class="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
			Rotina Semanal
		</h2>

		<div class="overflow-hidden rounded-2xl border bg-background shadow-sm">
			{#each data.workingHours as day (day.id)}
				<form
					id="form-{day.id}"
					method="POST"
					action="?/updateWorkingDay"
					use:enhance={() =>
						async ({ result, update }) => {
							await update({ invalidateAll: true });
						}}
					class="border-b last:border-b-0"
				>
					<input type="hidden" name="id" value={day.id} />
					<input
						type="checkbox"
						name="is_active"
						id="check-{day.id}"
						checked={day.is_active}
						class="hidden"
					/>

					<!-- Linha principal: toggle + dia -->
					<div class="flex items-center gap-4 px-4 py-3.5">
						<Switch
							checked={day.is_active}
							onCheckedChange={(v) => {
								day.is_active = v;
								const checkbox = document.getElementById(`check-${day.id}`) as HTMLInputElement;
								if (checkbox) checkbox.checked = v;
								setTimeout(() => {
									(document.getElementById(`form-${day.id}`) as HTMLFormElement)?.requestSubmit();
								}, 50);
							}}
						/>
						<span class="flex-1 text-sm font-semibold">
							{daysOfWeek[day.day_of_week]}
						</span>
						{#if !day.is_active}
							<span
								class="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground"
							>
								Fechado
							</span>
						{:else}
							<span class="font-mono text-xs text-muted-foreground">
								{day.start_time?.slice(0, 5)} – {day.end_time?.slice(0, 5)}
							</span>
						{/if}
					</div>

					<!-- Inputs de tempo (apenas quando ativo) -->
					{#if day.is_active}
						<div class="flex items-center gap-2 px-4 pb-3.5" class:opacity-30={!day.is_active}>
							<div class="flex flex-1 items-center gap-2">
								<Input
									type="time"
									name="start_time"
									value={day.start_time}
									class="h-10 flex-1 font-mono text-sm"
									readonly={!day.is_active}
									oninput={(e) => handleTimeChange(e, day.id, day.is_active)}
								/>
								<span class="shrink-0 font-mono text-xs text-muted-foreground">até</span>
								<Input
									type="time"
									name="end_time"
									value={day.end_time}
									class="h-10 flex-1 font-mono text-sm"
									readonly={!day.is_active}
									oninput={(e) => handleTimeChange(e, day.id, day.is_active)}
								/>
							</div>
						</div>
					{/if}
				</form>
			{/each}
		</div>
	</section>

	<!-- Exceções -->
	<section class="space-y-3">
		<h2 class="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
			Próximas Exceções
		</h2>

		{#if data.overrides.length === 0}
			<div class="rounded-2xl border bg-background py-12 text-center shadow-sm">
				<p class="text-sm text-muted-foreground italic">Nenhuma exceção futura.</p>
			</div>
		{:else}
			{#if data.overrides.length > 0}
				<p class="text-center text-[11px] text-muted-foreground/60 select-none">
					← Deslize para excluir
				</p>
			{/if}
			<div class="overflow-hidden rounded-2xl border bg-background shadow-sm">
				{#each data.overrides as override (override.id)}
					<div class="relative overflow-hidden border-b last:border-b-0">
						<!-- Fundo: deletar -->
						<div
							class="absolute inset-y-0 right-0 flex w-20 items-center justify-center bg-destructive"
						>
							<form method="POST" action="?/deleteOverride" use:enhance>
								<input type="hidden" name="id" value={override.id} />
								<button
									type="submit"
									class="flex h-full w-20 flex-col items-center justify-center gap-1 text-white active:opacity-70"
								>
									<Trash2 class="size-5" />
									<span class="text-[10px] font-semibold">Excluir</span>
								</button>
							</form>
						</div>

						<!-- Conteúdo deslizável -->
						<div
							class="relative z-10 flex items-center gap-3 bg-background px-4 py-3.5 will-change-transform"
							class:transition-transform={!touching}
							style="transform: translateX({swipedId === override.id ? SWIPE_OPEN_X : 0}px)"
							ontouchstart={(e) => onTouchStart(e, override.id)}
							ontouchmove={(e) => onTouchMove(e)}
							ontouchend={(e) => onTouchEnd(e, override.id)}
						>
							{#if override.is_available}
								<CalendarCheck class="size-5 shrink-0 text-green-500" />
							{:else}
								<CalendarX class="size-5 shrink-0 text-destructive" />
							{/if}
							<div class="min-w-0 flex-1">
								<p class="text-sm font-semibold">
									{new Date(override.date + 'T00:00:00').toLocaleDateString('pt-BR', {
										weekday: 'short',
										day: '2-digit',
										month: 'short'
									})}
								</p>
								<p class="text-xs text-muted-foreground">
									{override.is_available
										? `${override.start_time.slice(0, 5)} – ${override.end_time.slice(0, 5)}`
										: 'Indisponível'}
									{#if override.note}
										<span class="ml-1 italic">· {override.note}</span>
									{/if}
								</p>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</section>
</div>

<!-- FAB: Nova Exceção (mobile) -->
<button
	onclick={() => (openOverrideForm = true)}
	class="fixed right-4 z-30 flex items-center gap-2 rounded-full bg-primary px-5 py-3.5
		text-sm font-semibold text-primary-foreground shadow-[0_4px_20px_rgba(0,0,0,0.25)]
		transition-all duration-150 active:scale-95 sm:hidden"
	style="bottom: calc(4rem + 1rem + env(safe-area-inset-bottom))"
>
	<Plus class="size-5" />
	Nova Exceção
</button>

<!-- ─────────────────────── DESKTOP ─────────────────────────────── -->
<div class="hidden w-full space-y-8 p-6 sm:block md:max-w-xl lg:max-w-3xl">
	<div>
		<h1 class="text-2xl font-bold tracking-tight">Horários</h1>
		<p class="text-sm text-muted-foreground">Sua rotina semanal e datas excepcionais.</p>
	</div>

	<div class="grid gap-8 lg:grid-cols-5">
		<!-- Rotina semanal -->
		<div class="space-y-4 lg:col-span-3">
			<h2 class="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
				Rotina Semanal
			</h2>
			{#each data.workingHours as day (day.id)}
				<form
					id="form-d-{day.id}"
					method="POST"
					action="?/updateWorkingDay"
					use:enhance={() =>
						async ({ result, update }) => {
							await update({ invalidateAll: true });
						}}
					class="flex flex-col gap-3 rounded-xl border bg-card p-4 hover:shadow-sm sm:flex-row sm:items-center"
				>
					<input type="hidden" name="id" value={day.id} />
					<input
						type="checkbox"
						name="is_active"
						id="check-d-{day.id}"
						checked={day.is_active}
						class="hidden"
					/>
					<div class="flex flex-1 items-center gap-4">
						<Switch
							checked={day.is_active}
							onCheckedChange={(v) => {
								day.is_active = v;
								const cb = document.getElementById(`check-d-${day.id}`) as HTMLInputElement;
								if (cb) cb.checked = v;
								setTimeout(() => {
									(document.getElementById(`form-d-${day.id}`) as HTMLFormElement)?.requestSubmit();
								}, 50);
							}}
						/>
						<span class="w-28 text-sm font-medium">{daysOfWeekFull[day.day_of_week]}</span>
					</div>
					<div class="flex min-w-0 items-center gap-2" class:opacity-30={!day.is_active}>
						<Input
							type="time"
							name="start_time"
							value={day.start_time}
							class="h-9 w-full min-w-0"
							readonly={!day.is_active}
							oninput={(e) => handleTimeChange(e, day.id, day.is_active)}
						/>
						<span class="font-mono text-xs text-muted-foreground">–</span>
						<Input
							type="time"
							name="end_time"
							value={day.end_time}
							class="h-9 w-full min-w-0"
							readonly={!day.is_active}
							oninput={(e) => handleTimeChange(e, day.id, day.is_active)}
						/>
					</div>
				</form>
			{/each}
		</div>

		<!-- Exceções desktop -->
		<div class="space-y-6 lg:col-span-2">
			<div class="rounded-xl border bg-card p-5">
				<h3 class="mb-1 text-base font-semibold">Nova Exceção</h3>
				<p class="mb-4 text-sm text-muted-foreground">Feriados, folgas ou horários especiais.</p>
				{@render overrideForm('desktop')}
			</div>

			<div class="space-y-3">
				<h3 class="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
					Próximas Exceções
				</h3>
				{#each data.overrides as override (override.id)}
					<div class="group flex items-center justify-between rounded-lg border bg-background p-3">
						<div class="flex items-start gap-3">
							{#if override.is_available}
								<CalendarCheck class="mt-0.5 size-5 text-green-500" />
							{:else}
								<CalendarX class="mt-0.5 size-5 text-destructive" />
							{/if}
							<div>
								<p class="text-sm font-bold">
									{new Date(override.date + 'T00:00:00').toLocaleDateString('pt-BR')}
								</p>
								<p class="text-xs text-muted-foreground">
									{override.is_available
										? `${override.start_time.slice(0, 5)} – ${override.end_time.slice(0, 5)}`
										: 'Indisponível'}
								</p>
								{#if override.note}
									<p class="mt-1 text-[10px] italic">{override.note}</p>
								{/if}
							</div>
						</div>
						<form method="POST" action="?/deleteOverride" use:enhance>
							<input type="hidden" name="id" value={override.id} />
							<Button
								type="submit"
								variant="ghost"
								size="icon"
								class="opacity-0 transition-opacity group-hover:opacity-100"
							>
								<Trash2 class="size-4 text-destructive" />
							</Button>
						</form>
					</div>
				{:else}
					<p class="py-4 text-center text-xs italic text-muted-foreground">
						Nenhuma exceção futura.
					</p>
				{/each}
			</div>
		</div>
	</div>
</div>

<!-- ─────────── Drawer: Nova Exceção (mobile) ──────────────────── -->
<Drawer.Root bind:open={openOverrideForm}>
	<Drawer.Content>
		<Drawer.Header class="border-b text-left">
			<Drawer.Title>Nova Exceção</Drawer.Title>
			<Drawer.Description>Feriado, folga ou horário especial.</Drawer.Description>
		</Drawer.Header>
		<div class="overflow-y-auto px-4 py-5">
			{@render overrideForm('mobile')}
		</div>
	</Drawer.Content>
</Drawer.Root>

<!-- ───────────── Snippet: formulário de exceção ──────────────── -->
{#snippet overrideForm(context: 'mobile' | 'desktop')}
	<form
		method="POST"
		action="?/upsertOverride"
		class="space-y-4"
		use:enhance={() => {
			isLoading = true;
			return async ({ result, update }) => {
				await update();
				isLoading = false;
				if (result.type === 'success') {
					toast.success('Exceção salva com sucesso!');
					isAvailableOverride = false;
					if (context === 'mobile') openOverrideForm = false;
				}
			};
		}}
	>
		<div class="grid gap-2">
			<Label for="date-{context}">Data</Label>
			<Input id="date-{context}" type="date" name="date" required />
		</div>

		<div class="flex items-center justify-between rounded-lg border bg-muted/20 p-3">
			<Label class="text-sm">Estará disponível?</Label>
			<input type="checkbox" name="is_available" checked={isAvailableOverride} class="hidden" />
			<Switch checked={isAvailableOverride} onCheckedChange={(v) => (isAvailableOverride = v)} />
		</div>

		{#if isAvailableOverride}
			<div class="grid grid-cols-2 gap-4">
				<div class="grid gap-2">
					<Label class="text-xs">Início</Label>
					<Input type="time" name="start_time" required={isAvailableOverride} class="font-mono" />
				</div>
				<div class="grid gap-2">
					<Label class="text-xs">Término</Label>
					<Input type="time" name="end_time" required={isAvailableOverride} class="font-mono" />
				</div>
			</div>
		{/if}

		<div class="grid gap-2">
			<Label>Observação <span class="text-muted-foreground">(opcional)</span></Label>
			<Input name="note" placeholder="Ex: Feriado Municipal" />
		</div>

		<Button type="submit" disabled={isLoading} class="w-full cursor-pointer">
			{#if isLoading}
				<LoaderCircle class="mr-2 size-4 animate-spin" /> Salvando...
			{:else}
				Salvar Exceção
			{/if}
		</Button>

		{#if context === 'mobile'}
			<Drawer.Close asChild>
				<Button variant="outline" class="w-full cursor-pointer">Cancelar</Button>
			</Drawer.Close>
		{/if}
	</form>
{/snippet}
