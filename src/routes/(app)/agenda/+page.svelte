<script lang="ts">
	import { Plus, Copy, MessageCircle, Check, CalendarDays } from '@lucide/svelte';

	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import * as Dialog from '$lib/components/ui/dialog';

	import AppointmentForm from '$lib/components/dashboard/appointment-form.svelte';
	import AppointmentCardAction from '$lib/components/dashboard/appointment-card-action.svelte';

	import { navigating, page } from '$app/state';
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';

	import DatePicker from '$lib/components/date-picker.svelte';
	import { parseDate, getLocalTimeZone } from '@internationalized/date';

	let { data } = $props();
	let ticker = $state(Date.now());
	$effect(() => {
		let interval: ReturnType<typeof setInterval>;

		// 1. Calcula quantos ms faltam para o próximo minuto exato
		const now = Date.now();
		const msUntilNextMinute = 60000 - (now % 60000);

		// 2. Cria um timeout para esperar o início do próximo minuto
		const timeout = setTimeout(() => {
			ticker = Date.now(); // Atualiza no segundo zero

			// 3. Agora sim, inicia o intervalo de 1 em 1 minuto
			interval = setInterval(() => {
				ticker = Date.now();
			}, 60000);
		}, msUntilNextMinute);

		return () => {
			clearTimeout(timeout);
			if (interval) clearInterval(interval);
		};
	});
	const timeFormatter = new Intl.DateTimeFormat('pt-BR', {
		timeZone: 'America/Sao_Paulo',
		hour: '2-digit',
		minute: '2-digit',
		hour12: false
	});

	// Agora o 'now' será atualizado a cada minuto porque depende de 'ticker'
	const reactiveNow = $derived(timeFormatter.format(new Date(ticker)));

	let showAppointmentModal = $state(false);
	let copied = $state(false);
	let showCalendarPicker = $state(false);

	function handleCalendarSelect(d: any) {
		if (!d) return;

		// Converte o objeto DateValue para YYYY-MM-DD
		const newDateStr = d.toString();

		const newUrl = new URL(page.url);
		newUrl.searchParams.set('date', newDateStr);

		goto(newUrl.search, {
			replaceState: true,
			keepFocus: true,
			noScroll: true
		});

		showCalendarPicker = false;
	}

	const schedulingLink = $derived(`coelo.dev/${data.username}`);

	// ── Datas ─────────────────────────────────────────────────────
	const parsedDate = $derived.by(() => {
		const [y, m, d] = data.selectedDate.split('-').map(Number);
		return new Date(y, m - 1, d);
	});

	// refactor 'hoje'
	const dateFormatter = new Intl.DateTimeFormat('sv-SE', {
		// 'sv-SE' cospe YYYY-MM-DD
		timeZone: 'America/Sao_Paulo',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	});

	const todayStr = $derived(dateFormatter.format(new Date(ticker)));

	const isTodayView = $derived(data.selectedDate === todayStr);

	const headerLabel = $derived.by(() => {
		if (isTodayView) return 'Hoje';

		return new Intl.DateTimeFormat('pt-BR', {
			weekday: 'short',
			day: 'numeric',
			month: 'short'
		}).format(parsedDate);
	});

	function navigateDay(offset: number) {
		const date = new Date(parsedDate);
		date.setDate(date.getDate() + offset);

		const newUrl = new URL(page.url);
		newUrl.searchParams.set('date', date.toISOString().split('T')[0]);

		goto(newUrl.search, {
			keepFocus: true,
			noScroll: true,
			replaceState: true
		});
	}

	// ── Strip de datas ────────────────────────────────────────────
	function makeStrip(center: Date) {
		return Array.from({ length: 7 }, (_, i) => {
			const d = new Date(center);
			d.setDate(center.getDate() - 3 + i);

			return {
				str: d.toISOString().split('T')[0],
				day: d.getDate(),
				wd: new Intl.DateTimeFormat('pt-BR', {
					weekday: 'short'
				})
					.format(d)
					.replace('.', '')
					.slice(0, 3)
					.toUpperCase()
			};
		});
	}

	const strip = $derived(makeStrip(parsedDate));

	// ── Clipboard ─────────────────────────────────────────────────
	function copyToClipboard() {
		navigator.clipboard
			.writeText(schedulingLink)
			.then(() => {
				copied = true;
				setTimeout(() => (copied = false), 2000);
			})
			.catch(() => toast.error('Erro ao copiar o link.'));
	}

	// ── Swipe ─────────────────────────────────────────────────────
	let touchStartX = 0;
	let touchStartY = 0;

	function handleTouchStart(e: TouchEvent) {
		touchStartX = e.changedTouches[0].screenX;
		touchStartY = e.changedTouches[0].screenY;
	}

	function handleTouchEnd(e: TouchEvent) {
		const dx = touchStartX - e.changedTouches[0].screenX;
		const dy = touchStartY - e.changedTouches[0].screenY;

		if (Math.abs(dy) > Math.abs(dx)) return;

		if (Math.abs(dx) > 70) {
			if (dx > 70) navigateDay(1);
			else navigateDay(-1);
		}
	}

	// ── Status ────────────────────────────────────────────────────
	const STATUS: Record<
		string,
		{
			label: string;
			bg: string;
			text: string;
		}
	> = {
		confirmed: {
			label: 'confirmado',
			bg: '#EAF3DE',
			text: '#3B6D11'
		},
		pending: {
			label: 'pendente',
			bg: '#FAEEDA',
			text: '#854F0B'
		},
		cancelled: {
			label: 'cancelado',
			bg: '#FEE2E2',
			text: '#991B1B'
		}
	};

	// ── Organização ───────────────────────────────────────────────
	const nextAppointment = $derived.by(() => {
		if (!isTodayView) return null;
		// Agora ele reage ao reactiveNow!
		return data.appointments.find((a: any) => a.start_at >= reactiveNow) ?? null;
	});

	const laterAppointments = $derived.by(() => {
		if (!isTodayView) return [];
		return data.appointments.filter((a: any) => a !== nextAppointment && a.start_at >= reactiveNow);
	});

	const pastAppointments = $derived.by(() => {
		if (!isTodayView) return [];
		return data.appointments.filter((a: any) => a.start_at < reactiveNow);
	});

	function soonLabel(t: string) {
		if (!isTodayView) return '';

		const [h, m] = t.split(':').map(Number);

		// Pegamos o momento atual no fuso de SP
		const nowInSP = new Date(
			new Intl.DateTimeFormat('en-US', {
				timeZone: 'America/Sao_Paulo',
				year: 'numeric',
				month: 'numeric',
				day: 'numeric',
				hour: 'numeric',
				minute: 'numeric',
				second: 'numeric',
				hour12: false
			}).format(new Date(ticker))
		);

		const target = new Date(nowInSP);
		target.setHours(h, m, 0, 0);

		const diff = Math.floor((target.getTime() - nowInSP.getTime()) / 60000);

		if (diff <= 0 && diff > -30) return 'agora'; // janela de 30min para "agora"
		if (diff <= -30) return '';
		if (diff < 60) return `em ${diff} min`;

		return `em ${Math.round(diff / 60)}h`;
	}
</script>

<!-- MOBILE -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="flex h-full touch-pan-y flex-col bg-background sm:hidden"
	ontouchstart={handleTouchStart}
	ontouchend={handleTouchEnd}
>
	<!-- HEADER -->
	<div
		class="sticky top-0 z-20 bg-background/80 backdrop-blur-xl"
		ontouchstart={(e) => e.stopPropagation()}
		ontouchend={(e) => e.stopPropagation()}
	>
		<div class="flex items-start justify-between px-5 pt-6 pb-3">
			<div>
				<h1
					class="text-[1.5rem] leading-none font-semibold tracking-tight capitalize"
					class:opacity-40={navigating.to}
				>
					{headerLabel}
				</h1>
			</div>

			<div
				class="mt-0.5 flex size-10 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground"
			>
				L
			</div>
		</div>

		<!-- STRIP -->
		<div
			class="no-scrollbar flex gap-2 overflow-x-auto px-5 pb-0"
			ontouchstart={(e) => e.stopPropagation()}
			ontouchend={(e) => e.stopPropagation()}
		>
			{#each strip as day}
				<button
					onclick={() => {
						const newUrl = new URL(page.url);
						newUrl.searchParams.set('date', day.str);

						goto(newUrl.search, {
							replaceState: true,
							keepFocus: true,
							noScroll: true
						});
					}}
					class={`flex min-w-[58px] shrink-0 flex-col items-center rounded-full border py-3 transition-all ${
						day.str === data.selectedDate
							? 'border-black opacity-100'
							: 'border-border/40 opacity-45'
					}`}
				>
					<span
						class="text-[10px] tracking-wide uppercase"
						class:text-black={day.str === data.selectedDate}
						class:text-muted-foreground={day.str !== data.selectedDate}
					>
						{day.wd}
					</span>

					<span
						class="mt-0.5 text-[16px] leading-none font-medium"
						class:text-black={day.str === data.selectedDate}
						class:text-muted-foreground={day.str !== data.selectedDate}
					>
						{day.day}
					</span>
				</button>
			{/each}
			<Dialog.Root bind:open={showCalendarPicker}>
				<Dialog.Trigger
					ontouchstart={(e) => e.stopPropagation()}
					ontouchend={(e) => e.stopPropagation()}
					class="flex min-w-[58px] shrink-0 flex-col items-center justify-center rounded-full border border-border/40 bg-muted/30 py-3 transition-all active:scale-95"
				>
					<CalendarDays class="size-5 text-muted-foreground" />
					<span class="mt-1 text-[9px] font-bold text-muted-foreground uppercase">Ver</span>
				</Dialog.Trigger>

				<Dialog.Content
					class="fixed top-[50%] left-[50%] z-50 w-[92vw] max-w-xs translate-x-[-50%] translate-y-[-50%] rounded-[32px] border bg-background p-4 shadow-lg"
				>
					<DatePicker value={parseDate(data.selectedDate)} onValueChange={handleCalendarSelect} />
				</Dialog.Content>
			</Dialog.Root>
		</div>
	</div>

	<!-- CONTENT -->
	<div class="flex-1 overflow-y-auto pb-36">
		{#if data.appointments.length === 0}
			<div class="px-4 pt-10">
				<div
					class="flex flex-col items-center justify-center rounded-[28px] border border-dashed py-16"
				>
					<CalendarDays class="mb-3 size-9 text-muted-foreground/30" />

					<p class="text-sm text-muted-foreground">Nenhum agendamento neste dia.</p>
				</div>
			</div>
		{:else if isTodayView}
			{#if nextAppointment}
				<p class="section-label">próximo</p>

				<div class="px-3">
					{@render card(nextAppointment, true, false, true)}
				</div>
			{/if}

			{#if laterAppointments.length > 0}
				<p class="section-label">mais tarde</p>

				<div class="flex flex-col gap-2 px-3">
					{#each laterAppointments as appointment}
						{@render card(appointment)}
					{/each}
				</div>
			{/if}

			{#if pastAppointments.length > 0}
				<p class="section-label">anteriores</p>

				<div class="flex flex-col gap-2 px-3">
					{#each pastAppointments as appointment}
						{@render card(appointment, false, true)}
					{/each}
				</div>
			{/if}
		{:else}
			<div class="flex flex-col gap-2 px-3 pt-3">
				{#each data.appointments as appointment}
					{@render card(appointment)}
				{/each}
			</div>
		{/if}

		<!-- LINK CARD -->
		<div class="px-3 pt-5">
			<div class="rounded-[30px] border bg-card p-5">
				<p class="text-[11px] font-semibold tracking-[0.15em] text-muted-foreground uppercase">
					Link de agendamento
				</p>

				<p class="mt-2 truncate font-mono text-[13px] text-muted-foreground">
					{schedulingLink}
				</p>

				<button
					onclick={copyToClipboard}
					class="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border bg-muted/40 text-[14px] font-medium transition-all active:scale-[0.98]"
				>
					{#if copied}
						<Check class="size-4" />
						Copiado!
					{:else}
						<Copy class="size-4" />
						Copiar link
					{/if}
				</button>
			</div>
		</div>
	</div>
</div>

<!-- CARD -->
{#snippet card(appt: any, highlighted = false, dimmed = false, showSoon = false)}
	{@const soon = soonLabel(appt.start_at)}

	<div
		class={`flex gap-4 rounded-[30px] border bg-card px-5 py-5 transition-all active:scale-[0.985] ${
			highlighted ? 'border-border' : 'border-border/50'
		}`}
		class:opacity-40={dimmed}
	>
		<div class="flex min-w-[52px] flex-col items-center pt-0.5">
			<span class="text-[15px] leading-none font-semibold tabular-nums">
				{appt.start_at}
			</span>

			<div class="my-2 w-px flex-1 bg-border" style="min-height:22px"></div>

			<span class="text-[12px] leading-none text-muted-foreground tabular-nums">
				{appt.end_at}
			</span>
		</div>

		<div class="min-w-0 flex-1">
			<div class="flex items-start justify-between gap-3">
				<div class="min-w-0">
					<p class="truncate text-[17px] leading-tight font-semibold">
						{appt.customer_name}
					</p>

					<p class="mt-1 text-[13px] text-muted-foreground">
						{appt.service_name}
					</p>
				</div>

				<div class="shrink-0">
					<AppointmentCardAction appointmentId={appt.id} appointmentStatus={appt.status} />
				</div>
			</div>

			<div class="mt-4 flex flex-wrap items-center gap-2">
				{#if showSoon && soon}
					<span
						class="inline-flex rounded-full px-3 py-1 text-[12px] font-medium"
						style="background:#E6F1FB;color:#185FA5"
					>
						{soon}
					</span>
				{/if}

				{#if STATUS[appt.status]}
					<Badge
						class="rounded-full border-none px-3 py-1 text-[12px] font-medium"
						style={`background:${STATUS[appt.status].bg};color:${STATUS[appt.status].text}`}
					>
						{STATUS[appt.status].label}
					</Badge>
				{/if}

				{#if appt.customer_phone}
					<a
						href="https://wa.me/{appt.customer_phone.replace(/\D/g, '')}"
						target="_blank"
						class="ml-auto flex items-center gap-1.5 text-muted-foreground transition-opacity active:opacity-60"
					>
						<MessageCircle class="size-4" />
					</a>
				{/if}
			</div>
		</div>
	</div>
{/snippet}

<!-- FAB -->
<button
	onclick={() => (showAppointmentModal = true)}
	class="fixed right-5 bottom-24 z-30 flex size-16 items-center justify-center rounded-full bg-black text-white shadow-2xl transition-all active:scale-95 sm:hidden"
>
	<Plus class="size-7" strokeWidth={2.5} />
</button>

<!-- DESKTOP -->
<div class="mx-auto hidden max-w-5xl p-8 sm:block">
	<div class="mb-8 flex items-center justify-between">
		<div>
			<h1 class="text-4xl font-semibold tracking-tight capitalize">
				{headerLabel}
			</h1>
			<p class="mt-2 text-muted-foreground">Visualize e gerencie seus atendimentos.</p>
		</div>

		<Button
			onclick={() => (showAppointmentModal = true)}
			class="h-12 cursor-pointer rounded-2xl px-6"
		>
			<Plus class="mr-2 size-5" />
			Novo Agendamento
		</Button>
	</div>

	<div class="flex flex-col gap-4">
		{#if data.appointments.length === 0}
			<div
				class="flex flex-col items-center justify-center rounded-[28px] border border-dashed py-20"
			>
				<CalendarDays class="mb-3 size-10 text-muted-foreground/30" />
				<p class="text-muted-foreground">Nenhum agendamento neste dia.</p>
			</div>
		{:else if isTodayView}
			{#if nextAppointment}
				<p class="section-label px-0">próximo</p>
				{@render card(nextAppointment, true, false, true)}
			{/if}

			{#if laterAppointments.length > 0}
				<p class="section-label px-0">mais tarde</p>
				<div class="flex flex-col gap-3">
					{#each laterAppointments as appointment}
						{@render card(appointment)}
					{/each}
				</div>
			{/if}

			{#if pastAppointments.length > 0}
				<p class="section-label px-0">anteriores</p>
				<div class="flex flex-col gap-3">
					{#each pastAppointments as appointment}
						{@render card(appointment, false, true)}
					{/each}
				</div>
			{/if}
		{:else}
			<!-- Visualização de outros dias (sem hierarquia de horário atual) -->
			<div class="flex flex-col gap-3">
				{#each data.appointments as appointment}
					{@render card(appointment)}
				{/each}
			</div>
		{/if}
	</div>
</div>

<!-- MODAL -->
<Dialog.Root bind:open={showAppointmentModal}>
	<Dialog.Content
		class="flex max-h-[90dvh] w-[95vw] flex-col gap-0 overflow-hidden rounded-[32px] p-0 sm:max-w-[420px]"
	>
		<Dialog.Header class="border-b px-6 py-5">
			<Dialog.Title class="text-xl">Novo Agendamento</Dialog.Title>

			<Dialog.Description class="capitalize">
				{headerLabel}
			</Dialog.Description>
		</Dialog.Header>

		<div class="overflow-y-auto">
			<AppointmentForm
				open={showAppointmentModal}
				customers={data.customers}
				services={data.services}
				selectedDate={data.selectedDate}
				{data}
				onSuccess={() => (showAppointmentModal = false)}
			/>
		</div>
	</Dialog.Content>
</Dialog.Root>

{#if showCalendarPicker}
	{console.log('clicado')}
	<!-- Aqui entraria seu componente de Calendar. 
         Ao selecionar, você rodaria algo como:
         const newUrl = new URL(page.url);
         newUrl.searchParams.set('date', selectedDateFromCalendar);
         goto(newUrl.search);
         showCalendarPicker = false;
    -->
{/if}

<style>
	.no-scrollbar::-webkit-scrollbar {
		display: none;
	}

	.no-scrollbar {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}

	button {
		-webkit-tap-highlight-color: transparent;
	}

	.section-label {
		padding: 14px 16px 8px;

		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.14em;
		text-transform: uppercase;

		color: hsl(var(--muted-foreground));
		opacity: 0.7;
	}
</style>
