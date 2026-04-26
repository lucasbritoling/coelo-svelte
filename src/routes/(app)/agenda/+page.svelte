<script lang="ts">
	import { Clock, Plus, Copy, MessageCircle, Check } from '@lucide/svelte';
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { navigating } from '$app/state';
	import * as Dialog from '$lib/components/ui/dialog';
	import AppointmentForm from '$lib/components/dashboard/appointment-form.svelte';
	import { toast } from 'svelte-sonner';

	let showAppointmentModal = $state(false);

	import AppointmentCardAction from '$lib/components/dashboard/appointment-card-action.svelte';

	// Svelte 5: Recebendo os dados da load function
	let copied = $state(false);
	let { data } = $props();

	const schedulingLink = $derived(`coelo.dev/${data.username}`);

	function copyToClipboard() {
		navigator.clipboard
			.writeText(schedulingLink)
			.then(() => {
				// Ativa o estado de feedback e reseta após 2 segundos
				copied = true;
				toast.success('Link copiado!');
				setTimeout(() => {
					copied = false;
				}, 2000);
			})
			.catch(() => {
				toast.error('Erro ao copiar o link.');
			});
	}

	// Título formatado reativo (substitui o DynamicAgendaHeader do Next)
	// Usamos a Intl nativa para evitar dependências extras como date-fns no cliente
	let formattedTitle = $derived.by(() => {
		const [y, m, d] = data.selectedDate.split('-').map(Number);
		const date = new Date(y, m - 1, d);
		return new Intl.DateTimeFormat('pt-BR', {
			weekday: 'long',
			day: 'numeric',
			month: 'long'
		}).format(date);
	});
</script>

<div class="mx-auto flex max-w-7xl flex-col gap-6 p-6">
	<!-- Título -->
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div class={navigating.to ? 'opacity-50 transition-opacity' : ''}>
			<h1 class="text-2xl font-bold tracking-tight capitalize">
				{formattedTitle}
			</h1>
			<p class="text-sm text-muted-foreground">
				Visualize e controle seus atendimentos profissionais.
			</p>
		</div>

		<div class="flex items-center">
			<Dialog.Root bind:open={showAppointmentModal}>
				<Dialog.Trigger>
					{#snippet child({ props })}
						<Button {...props} size="sm" class="h-9 hover:shadow-sm cursor-pointer">
							<Plus class="mr-2 h-4 w-4" /> Novo Horário
						</Button>
					{/snippet}
				</Dialog.Trigger>

				<Dialog.Content class="sm:max-w-106.25">
					<Dialog.Header>
						<Dialog.Title>Novo Horário</Dialog.Title>
						<Dialog.Description class="capitalize">
							{formattedTitle}
						</Dialog.Description>
					</Dialog.Header>

					<AppointmentForm
						customers={data.customers}
						services={data.services}
						selectedDate={data.selectedDate}
						onSuccess={() => (showAppointmentModal = false)}
					/>
				</Dialog.Content>
			</Dialog.Root>
		</div>
	</div>

	<!--
	 Cards de Agendamento
	-->
	<div class="grid gap-8 lg:grid-cols-3">
		<div class="space-y-4 lg:col-span-2">
			<h2
				class="mb-2 flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase"
			>
				<Clock class="h-3.5 w-3.5 text-primary" />
				Atendimentos do Dia
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
							class="group relative overflow-hidden border-sidebar-border/50 shadow-sm transition-all hover:shadow-md hover:border-primary/40"
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
										<Card.Description class="text-xs">{appointment.service_name}</Card.Description>
									</div>
								</div>
							</Card.Header>

							<Card.Footer class="flex justify-between bg-muted/30 py-2">
								<div class="flex items-center gap-3">
									<Badge
										variant="outline"
										class="h-4.5 px-1.5 text-[9px] font-bold tracking-wider uppercase 
    {appointment.status === 'confirmed' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : ''}
    {appointment.status === 'cancelled' ? 'border-red-200 bg-red-50 text-red-700' : ''}
    {appointment.status === 'pending' ? 'border-slate-200 bg-slate-50 text-slate-600' : ''}"
									>
										{#if appointment.status === 'confirmed'}
											Confirmado
										{:else if appointment.status === 'cancelled'}
											Cancelado
										{:else}
											Pendente
										{/if}
									</Badge>

									{#if appointment.customer_phone}
										<a
											href="https://wa.me/{appointment.customer_phone.replace(
												/\D/g,
												''
											)}"
											target="_blank"
											class="group/wa flex items-center gap-2 font-mono text-[12px] text-green-600 transition-all hover:text-green-600 sm:text-muted-foreground/50"
										>
											<MessageCircle
												class="h-4 w-4 mb-0.5 text-green-500 group-hover/wa:fill-green-500/15"
											/>
											<span class="">{appointment.customer_phone}</span>
										</a>
									{/if}
								</div>
							</Card.Footer>
						</Card.Root>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Card de 'Copiar' Link -->

		<div class="space-y-6">
			<Card.Root class="border-none bg-zinc-50 shadow-none ring-1 ring-foreground/5 ring-inset">
				<Card.Header class="pb-3">
					<Card.Title class="text-sm font-semibold tracking-tight">Link de Agendamento</Card.Title>
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
						class="w-full gap-2 text-xs hover:shadow-sm font-medium transition-all cursor-pointer border-sm"
					>
						{#if copied}
							<Check class="h-3.5 w-3.5" />
							Copiado!
						{:else}
							<Copy class="h-3.5 w-3.5" />
							Copiar Link
						{/if}
					</Button>
				</Card.Content>
			</Card.Root>
		</div>
	</div>
</div>
