<script lang="ts">
	import {
		Clock,
		Plus,
		Copy,
		MessageCircle,
		Check,
		ChevronLeft,
		ChevronRight,
		Link,
		CalendarDays
	} from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Drawer from '$lib/components/ui/drawer';
	import * as Card from '$lib/components/ui/card';
	import AppointmentForm from '$lib/components/dashboard/appointment-form.svelte';
	import AppointmentCardAction from '$lib/components/dashboard/appointment-card-action.svelte';
	import { navigating, page } from '$app/state';
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import { MediaQuery } from 'svelte/reactivity';

	let { data } = $props();

	const isDesktop = new MediaQuery('(min-width: 640px)');
	let showAppointmentModal = $state(false);
	let copied = $state(false);

	const schedulingLink = $derived(`coelo.dev/${data.username}`);

	// ── Helpers de Data ──────────────────────────────────────────
	// Centraliza o parsing da data para evitar repetição
	const parsedDate = $derived.by(() => {
		const [y, m, d] = data.selectedDate.split('-').map(Number);
		return new Date(y, m - 1, d);
	});

	const isToday = $derived(data.selectedDate === new Date().toISOString().split('T')[0]);

	function navigateDay(offset: number) {
		const date = new Date(parsedDate);
		date.setDate(date.getDate() + offset);
		const newUrl = new URL(page.url);
		newUrl.searchParams.set('date', date.toISOString().split('T')[0]);
		goto(newUrl.search, { keepFocus: true, noScroll: true, replaceState: true });
	}

	function goToToday() {
		const newUrl = new URL(page.url);
		newUrl.searchParams.set('date', new Date().toISOString().split('T')[0]);
		goto(newUrl.search, { keepFocus: true, noScroll: true, replaceState: true });
	}

	// ── Título formatado ───────────────────────────────────────────
	const formattedTitle = $derived(
		new Intl.DateTimeFormat('pt-BR', {
			weekday: 'long',
			day: 'numeric',
			month: 'long'
		}).format(parsedDate)
	);

	const formattedTitleShort = $derived(
		new Intl.DateTimeFormat('pt-BR', {
			weekday: 'short',
			day: 'numeric',
			month: 'short'
		}).format(parsedDate)
	);

	// ── Ações ─────────────────────────────────────────────────────
	function copyToClipboard() {
		navigator.clipboard
			.writeText(schedulingLink)
			.then(() => {
				copied = true;
				setTimeout(() => (copied = false), 2000);
			})
			.catch(() => toast.error('Erro ao copiar o link.'));
	}

	function handleTouchStart(e: TouchEvent) {
		touchStartX = e.changedTouches[0].screenX;
		touchStartY = e.changedTouches[0].screenY;
	}

	let touchStartX = 0;
	let touchStartY = 0;

	function handleTouchEnd(e: TouchEvent) {
		const dx = touchStartX - e.changedTouches[0].screenX;
		const dy = touchStartY - e.changedTouches[0].screenY;
		if (Math.abs(dy) > Math.abs(dx)) return;
		if (Math.abs(dx) > 70) {
			if (e.cancelable) e.preventDefault();

			if (dx > 70) navigateDay(1);
			else if (dx < -70) navigateDay(-1);
		}
	}

	const statusLabel = (s: string) =>
		({
			confirmed: 'Confirmado',
			cancelled: 'Cancelado',
			pending: 'Pendente'
		})[s] || 'Pendente';

	const statusClass = (s: string) => {
		if (s === 'confirmed') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
		if (s === 'cancelled') return 'border-red-200 bg-red-50 text-red-700';
		return 'border-slate-200 bg-slate-50 text-slate-600';
	};
</script>

<!-- ─────────────────────── MOBILE ──────────────────────────────── -->
<div
	class="flex h-full touch-pan-y flex-col sm:hidden"
	ontouchstart={handleTouchStart}
	ontouchend={handleTouchEnd}
	role="region"
	aria-label="Agenda de atendimentos"
>
	<div class="sticky top-0 z-20 border-b bg-background/95 backdrop-blur-sm">
		<div class="flex items-center gap-2 px-2 py-2">
			<button
				onclick={() => navigateDay(-1)}
				class="flex size-10 items-center justify-center rounded-xl text-muted-foreground transition-colors active:bg-muted"
				aria-label="Dia anterior"
			>
				<ChevronLeft class="size-5" />
			</button>

			<button
				onclick={goToToday}
				class="flex min-w-0 flex-1 flex-col items-center py-0.5"
				aria-label="Ir para hoje"
			>
				<span
					class="text-base leading-tight font-bold capitalize transition-opacity"
					class:opacity-40={navigating.to}
				>
					{formattedTitleShort}
				</span>
				{#if !isToday}
					<span
						class="mt-0.5 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary"
					>
						toque para hoje
					</span>
				{/if}
			</button>

			<button
				onclick={() => navigateDay(1)}
				class="flex size-10 items-center justify-center rounded-xl text-muted-foreground transition-colors active:bg-muted"
				aria-label="Próximo dia"
			>
				<ChevronRight class="size-5" />
			</button>
		</div>
	</div>

	<div class="flex-1 overflow-y-auto pb-28">
		<div class="p-4" class:opacity-50={navigating.to}>
			{#if data.appointments.length === 0}
				<div class="flex flex-col items-center justify-center py-20 text-center">
					<CalendarDays class="mb-3 size-10 text-muted-foreground/30" />
					<p class="text-sm text-muted-foreground italic">Nenhum agendamento para este dia.</p>
				</div>
			{:else}
				<div class="space-y-3">
					{#each data.appointments as appointment (appointment.id)}
						<div class="relative overflow-hidden rounded-2xl border bg-background shadow-sm">
							<div
								class="absolute inset-y-0 left-0 w-1 rounded-l-2xl
									{appointment.status === 'confirmed' ? 'bg-emerald-400' : ''}
									{appointment.status === 'cancelled' ? 'bg-red-400 opacity-40' : ''}
									{appointment.status === 'pending' ? 'bg-slate-300' : ''}"
							></div>

							<div class="pt-3 pr-3 pb-2.5 pl-4">
								<div class="flex items-start justify-between gap-2">
									<div class="flex items-baseline gap-2">
										<span class="text-xl leading-none font-bold tabular-nums">
											{appointment.start_at}
										</span>
										<Badge
											variant="outline"
											class="h-4 px-1.5 text-[9px] font-bold tracking-wider uppercase {statusClass(
												appointment.status
											)}"
										>
											{statusLabel(appointment.status)}
										</Badge>
									</div>
									<div class="shrink-0">
										<AppointmentCardAction
											appointmentId={appointment.id}
											appointmentStatus={appointment.status}
										/>
									</div>
								</div>

								<div class="mt-1.5">
									<p class="leading-snug font-semibold">{appointment.customer_name}</p>
									<p class="text-xs text-muted-foreground">{appointment.service_name}</p>
								</div>

								{#if appointment.customer_phone}
									<div class="mt-2.5 border-t pt-2">
										<a
											href="https://wa.me/{appointment.customer_phone.replace(/\D/g, '')}"
											target="_blank"
											class="flex items-center gap-1.5 text-green-600 active:opacity-70"
										>
											<MessageCircle class="size-4 fill-green-500/15" />
											<span class="font-mono text-xs">{appointment.customer_phone}</span>
										</a>
									</div>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{/if}

			<div class="mt-6 rounded-2xl border bg-muted/30 p-4">
				<p class="mb-1 text-xs font-semibold text-muted-foreground">Seu link de agendamento</p>
				<p class="mb-3 truncate font-mono text-xs text-foreground/70">{schedulingLink}</p>
				<button
					onclick={copyToClipboard}
					class="flex w-full items-center justify-center gap-2 rounded-xl border bg-background py-2.5 text-sm font-medium transition-colors active:bg-muted
						{copied ? 'border-emerald-300 text-emerald-600' : 'text-foreground'}"
				>
					{#if copied}
						<Check class="size-4" /> Copiado!
					{:else}
						<Copy class="size-4" /> Copiar Link
					{/if}
				</button>
			</div>
		</div>
	</div>
</div>

<!-- FAB (Mobile) -->
<button
	onclick={() => (showAppointmentModal = true)}
	class="fixed right-4 z-30 flex items-center gap-2 rounded-full bg-primary px-5 py-3.5
		text-sm font-semibold text-primary-foreground shadow-[0_4px_20px_rgba(0,0,0,0.25)]
		transition-all duration-150 active:scale-95 sm:hidden"
	style="bottom: calc(4rem + 1rem + env(safe-area-inset-bottom))"
>
	<Plus class="size-5" /> Novo Horário
</button>

<!-- ─────────────────────── DESKTOP ─────────────────────────────── -->
<div class="hidden sm:block">
	<div class="mx-auto flex max-w-3xl flex-col gap-6 p-6">
		<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
			<div class={navigating.to ? 'opacity-50 transition-opacity' : ''}>
				<h1 class="text-2xl font-bold tracking-tight capitalize">{formattedTitle}</h1>
				<p class="text-sm text-muted-foreground">Visualize e controle seus atendimentos.</p>
			</div>
			<Button onclick={() => (showAppointmentModal = true)} size="sm" class="h-9">
				<Plus class="mr-2 h-4 w-4" /> Novo Horário
			</Button>
		</div>

		<div class="grid gap-8 lg:grid-cols-3">
			<div class="space-y-4 lg:col-span-2">
				<h2
					class="mb-2 flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase"
				>
					<Clock class="h-3.5 w-3.5 text-primary" /> Atendimentos do Dia
				</h2>

				{#if data.appointments.length === 0}
					<div
						class="flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 opacity-60"
					>
						<p class="text-sm text-muted-foreground italic">Nenhum agendamento encontrado.</p>
					</div>
				{:else}
					<div class="grid gap-3" class:opacity-50={navigating.to}>
						{#each data.appointments as appointment (appointment.id)}
							<Card.Root
								class="group relative max-w-sm overflow-hidden border-sidebar-border/50 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
							>
								<div
									class="absolute top-2 right-2 z-10 opacity-100 transition-opacity lg:opacity-0 lg:group-hover:opacity-100"
								>
									<AppointmentCardAction
										appointmentId={appointment.id}
										appointmentStatus={appointment.status}
									/>
								</div>
								<Card.Header class="flex-row items-center justify-between gap-5 space-y-0 pt-3">
									<div class="flex w-full items-center gap-5">
										<div class="flex min-w-18.75 flex-col border-r border-foreground/5 pr-5">
											<span class="text-base font-bold tracking-tight">{appointment.start_at}</span>
											<span
												class="text-[10px] font-medium tracking-widest text-muted-foreground/60 uppercase"
												>Início</span
											>
										</div>
										<div class="flex-1 space-y-0.5">
											<Card.Title class="text-sm font-semibold tracking-tight"
												>{appointment.customer_name}</Card.Title
											>
											<Card.Description class="text-xs">{appointment.service_name}</Card.Description
											>
										</div>
									</div>
								</Card.Header>
								<Card.Footer class="flex justify-between bg-muted/30 py-2">
									<div class="flex items-center gap-3">
										<Badge
											variant="outline"
											class="h-4.5 px-1.5 text-[9px] font-bold tracking-wider uppercase {statusClass(
												appointment.status
											)}"
										>
											{statusLabel(appointment.status)}
										</Badge>
										{#if appointment.customer_phone}
											<a
												href="https://wa.me/{appointment.customer_phone.replace(/\D/g, '')}"
												target="_blank"
												class="group/wa flex items-center gap-2 font-mono text-[12px] text-green-600 transition-all hover:text-green-600 sm:text-muted-foreground/50"
											>
												<MessageCircle
													class="mb-0.5 h-4 w-4 text-green-500 group-hover/wa:fill-green-500/15"
												/>
												<span>{appointment.customer_phone}</span>
											</a>
										{/if}
									</div>
								</Card.Footer>
							</Card.Root>
						{/each}
					</div>
				{/if}
			</div>

			<div class="space-y-6">
				<Card.Root class="border-none bg-zinc-50 shadow-none ring-1 ring-foreground/5 ring-inset">
					<Card.Header class="pb-3">
						<Card.Title class="text-sm font-semibold tracking-tight">Link de Agendamento</Card.Title
						>
						<Card.Description class="text-xs">Seus clientes marcam por aqui:</Card.Description>
					</Card.Header>
					<Card.Content class="space-y-3">
						<div
							class="truncate rounded-md border border-border bg-background/80 p-2.5 font-mono text-[11px] shadow-inner"
						>
							{schedulingLink}
						</div>
						<Button
							onclick={copyToClipboard}
							variant={copied ? 'default' : 'secondary'}
							size="sm"
							class="w-full gap-2 text-xs font-medium transition-all hover:shadow-sm"
						>
							{#if copied}
								<Check class="h-3.5 w-3.5" /> Copiado!
							{:else}
								<Copy class="h-3.5 w-3.5" /> Copiar Link
							{/if}
						</Button>
					</Card.Content>
				</Card.Root>
			</div>
		</div>
	</div>
</div>

{#if isDesktop.current}
	<Dialog.Root bind:open={showAppointmentModal}>
		<Dialog.Content class="sm:max-w-[425px]">
			<Dialog.Header>
				<Dialog.Title>Novo Horário</Dialog.Title>
				<Dialog.Description class="capitalize">{formattedTitle}</Dialog.Description>
			</Dialog.Header>
			<AppointmentForm
				customers={data.customers}
				services={data.services}
				selectedDate={data.selectedDate}
				{data}
				onSuccess={() => (showAppointmentModal = false)}
			/>
		</Dialog.Content>
	</Dialog.Root>
{:else}
	<Drawer.Root bind:open={showAppointmentModal}>
		<Drawer.Content>
			<Drawer.Header class="border-b text-left">
				<Drawer.Title>Novo Horário</Drawer.Title>
				<Drawer.Description class="capitalize">{formattedTitle}</Drawer.Description>
			</Drawer.Header>
			<div class="overflow-y-auto px-4 py-5">
				<AppointmentForm
					customers={data.customers}
					services={data.services}
					selectedDate={data.selectedDate}
					{data}
					onSuccess={() => (showAppointmentModal = false)}
				/>
			</div>
			<Drawer.Footer class="border-t">
				<Drawer.Close>
					{#snippet child({ props })}
						<Button {...props} variant="outline" class="w-full">Cancelar</Button>
					{/snippet}
				</Drawer.Close>
			</Drawer.Footer>
		</Drawer.Content>
	</Drawer.Root>
{/if}
