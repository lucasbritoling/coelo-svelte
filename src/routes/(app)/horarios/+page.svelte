<script lang="ts">
	import { Save, Plus, Trash2, CalendarX, CalendarCheck, Info } from '@lucide/svelte';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Switch } from '$lib/components/ui/switch';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';

	let { data } = $props();

	let saveTimeout: ReturnType<typeof setTimeout>;

	function handleTimeChange(e: Event) {
        const form = (e.currentTarget as HTMLInputElement).form;
        if (!form) return;

        // Limpa o timer anterior toda vez que o usuário digita algo novo
        clearTimeout(saveTimeout);

        // Define um novo timer de 1000ms (1 segundo)
        saveTimeout = setTimeout(() => {
            form.requestSubmit();
        }, 1000); 
    }

	const daysOfWeek = [
		'Domingo',
		'Segunda-feira',
		'Terça-feira',
		'Quarta-feira',
		'Quinta-feira',
		'Sexta-feira',
		'Sábado'
	];

	// Estado para o formulário de nova exceção
	let isAvailableOverride = $state(false);
</script>

<div class="mx-auto max-w-6xl space-y-8 p-6">
	<div>
		<h1 class="text-2xl font-bold tracking-tight">Horários</h1>
		<p class="text-sm text-muted-foreground">Gerencie sua rotina semanal e datas excepcionais.</p>
	</div>

	<div class="grid gap-8 lg:grid-cols-5">
		<div class="space-y-4 lg:col-span-3">
			<h2 class="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
				Rotina Semanal
			</h2>
			{#each data.workingHours as day (day.id)}
				<form
					id="form-{day.id}"
					method="POST"
					action="?/updateWorkingDay"
					use:enhance={() => {
						console.log(`ENVIANDO FORM ${day.id}:`, { is_active: day.is_active });
						return async ({ result, update }) => {
							console.log('RESULTADO DA ACTION RECEBIDO:', result.type);
							await update({ invalidateAll: true });
						};
					}}
					class="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-sm transition-all"
				>
					<input type="hidden" name="id" value={day.id} />

					<input
						type="checkbox"
						name="is_active"
						id="check-{day.id}"
						checked={day.is_active}
						class="hidden"
					/>

					<div class="flex flex-1 items-center gap-4">
						<Switch
							checked={day.is_active}
							onCheckedChange={(v) => {
								console.log(`SWITCH CLICK: Novo valor = ${v} para o dia ${day.day_of_week}`);

								// 1. Atualiza o estado reativo do Svelte 5
								day.is_active = v;

								// 2. Sincroniza o input nativo (o SvelteKit precisa dele)
								const checkbox = document.getElementById(`check-${day.id}`) as HTMLInputElement;
								if (checkbox) checkbox.checked = v;

								console.log('Checkbox real está marcado?', checkbox?.checked);

								// 3. Dispara o submit
								setTimeout(() => {
									const form = document.getElementById(`form-${day.id}`) as HTMLFormElement;
									form?.requestSubmit();
								}, 50);
							}}
						/>
						<span class="w-24 text-sm font-medium">{daysOfWeek[day.day_of_week]}</span>
					</div>

					<div class="flex items-center gap-2" class:opacity-30={!day.is_active}>
    <Input
        type="time"
        name="start_time"
        bind:value={day.start_time}
        class="h-9 w-28"
        readonly={!day.is_active}
        oninput={handleTimeChange} 
    />
    <span class="font-mono text-xs text-muted-foreground">-</span>
    <Input
        type="time"
        name="end_time"
        bind:value={day.end_time}
        class="h-9 w-28"
        readonly={!day.is_active}
        oninput={handleTimeChange} 
    />
</div>
				</form>
			{/each}
		</div>

		<div class="space-y-6 lg:col-span-2">
			<Card.Root>
				<Card.Header>
					<Card.Title class="text-base">Nova Exceção</Card.Title>
					<Card.Description>Feriados, folgas ou horários especiais.</Card.Description>
				</Card.Header>
				<Card.Content>
					<form method="POST" action="?/upsertOverride" use:enhance class="space-y-4">
						<div class="grid gap-2">
							<Label for="date">Data</Label>
							<Input type="date" name="date" required />
						</div>

						<div class="flex items-center justify-between rounded-lg border bg-muted/20 p-3">
							<Label for="is_available" class="text-sm">Estará disponível?</Label>
							<Switch name="is_available" bind:checked={isAvailableOverride} />
						</div>

						{#if isAvailableOverride}
							<div class="grid grid-cols-2 gap-4">
								<div class="grid gap-2">
									<Label class="text-xs">Início</Label>
									<Input type="time" name="start_time" required={isAvailableOverride} />
								</div>
								<div class="grid gap-2">
									<Label class="text-xs">Término</Label>
									<Input type="time" name="end_time" required={isAvailableOverride} />
								</div>
							</div>
						{/if}

						<div class="grid gap-2">
							<Label for="note">Observação (Opcional)</Label>
							<Input name="note" placeholder="Ex: Feriado Municipal" />
						</div>

						<Button type="submit" class="w-full">Salvar Exceção</Button>
					</form>
				</Card.Content>
			</Card.Root>

			<div class="space-y-3">
				<h3 class="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
					<Info class="size-4" /> Próximas Exceções
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
										? `${override.start_time.slice(0, 5)} - ${override.end_time.slice(0, 5)}`
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
					<p class="text-xs text-muted-foreground italic text-center py-4">
						Nenhuma exceção futura.
					</p>
				{/each}
			</div>
		</div>
	</div>
</div>
