<script lang="ts">
    import { today, getLocalTimeZone, parseDate } from '@internationalized/date';
    import { enhance } from '$app/forms';
    import { goto } from '$app/navigation';
    import { page } from '$app/state';

    // Components UI
    import { Calendar } from '$lib/components/ui/calendar/index.js';
    import * as RadioGroup from '$lib/components/ui/radio-group';
    import * as Card from '$lib/components/ui/card/index.js';
    import { Label } from '$lib/components/ui/label/index.js';
    import { Button } from '$lib/components/ui/button/index.js';
    import { Input } from '$lib/components/ui/input/index.js';
    import { LoaderCircle, CircleCheckBig, CalendarX2, ArrowLeft, Share2 } from '@lucide/svelte';

    let { data } = $props();

    // Derivados para facilitar o uso no template
    const professional = $derived(data.professional);
    const services = $derived(data.services);
    const slots = $derived(data.slots);

    // Estados locais de interface
    let isLoading = $state(false);
    let selectedSlot = $state<any>(null);
    let isConfirming = $state(false);
    let customerName = $state('');
    let customerPhone = $state('');

    // Sincroniza o calendário com a URL (Svelte 5 effect)
    let calendarValue = $state(data.selectedDate ? parseDate(data.selectedDate) : null);

    async function updateSelection(params: { date?: string; serviceId?: string }) {
        selectedSlot = null;
        isConfirming = false;

        const newUrl = new URL(page.url);
        if (params.date) newUrl.searchParams.set('date', params.date);
        if (params.serviceId) newUrl.searchParams.set('serviceId', params.serviceId);

        await goto(newUrl.search, {
            keepFocus: true,
            noScroll: true,
            replaceState: true
        });
    }

    function formatSlotTime(time: string) {
        return time?.slice(0, 5) ?? '';
    }
</script>

<svelte:head>
    <title>Agendar com {professional.full_name}</title>
</svelte:head>

<div class="mx-auto p-6 {data.uiState === 'single_service' ? 'max-w-md' : 'max-w-md lg:max-w-6xl'}">
    
    <!-- HEADER -->
    <header class="mb-8 text-center">
        <div class="mx-auto mb-4 size-24 overflow-hidden rounded-full border-2 bg-muted shadow-sm">
            {#if professional.avatar_url}
                <img src={professional.avatar_url} alt={professional.full_name} class="h-full w-full object-cover" />
            {/if}
        </div>
        <h1 class="text-3xl font-bold tracking-tight">{professional.full_name}</h1>
        <p class="font-medium text-muted-foreground">@{professional.username}</p>
    </header>

    {#if data.uiState === 'unavailable'}
        <!-- ESTADO: SEM SERVIÇOS -->
        <Card.Root class="mx-auto max-w-sm border-dashed">
            <Card.Content class="flex flex-col items-center justify-center py-12 text-center">
                <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                    <CalendarX2 class="text-muted-foreground" />
                </div>
                <h2 class="text-xl font-semibold">Agenda indisponível</h2>
                <p class="text-sm text-muted-foreground">Não há horários para agendamento no momento.</p>
            </Card.Content>
        </Card.Root>

    {:else}
        <!-- GRID PRINCIPAL -->
        <div class="grid gap-6 {data.uiState === 'multiple_services' ? 'lg:grid-cols-3' : 'lg:grid-cols-2'}">
            
            {#if data.uiState === 'multiple_services'}
                <!-- SELEÇÃO DE SERVIÇO (Apenas se houver mais de um) -->
                <Card.Root>
                    <Card.Header><Card.Title>1. Serviço</Card.Title></Card.Header>
                    <Card.Content>
                        <RadioGroup.Root 
                            value={data.selectedServiceId} 
                            onValueChange={(id) => updateSelection({ serviceId: id })}
                            class="space-y-3"
                        >
                            {#each services as service}
                                <Label
                                    for={service.id}
                                    class="flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-all hover:bg-muted {data.selectedServiceId === service.id ? 'border-primary ring-1 ring-primary' : ''}"
                                >
                                    <div class="flex flex-col gap-1">
                                        <span class="font-bold">{service.name}</span>
                                        <span class="text-xs text-muted-foreground">{service.duration} min</span>
                                    </div>
                                    <RadioGroup.Item value={service.id} id={service.id} class="sr-only" />
                                </Label>
                            {/each}
                        </RadioGroup.Root>
                    </Card.Content>
                </Card.Root>
            {/if}

            <!-- CALENDÁRIO -->
            <Card.Root>
                <Card.Header>
                    <Card.Title>{data.uiState === 'multiple_services' ? '2. Data' : '1. Escolha a data'}</Card.Title>
                </Card.Header>
                <Card.Content>
                    <Calendar
                        bind:value={calendarValue}
                        onValueChange={(v) => updateSelection({ date: v?.toString() })}
                        class="rounded-md border shadow-sm"
                        minValue={today(getLocalTimeZone())}
                    />
                </Card.Content>
            </Card.Root>

            <!-- HORÁRIOS / CONFIRMAÇÃO -->
            <Card.Root class="flex flex-col">
                <Card.Header>
                    <div class="flex items-center justify-between">
                        <Card.Title>Horário</Card.Title>
                        {#if !isConfirming && selectedSlot}
                            <Button size="sm" onclick={() => (isConfirming = true)}>Confirmar</Button>
                        {/if}
                    </div>
                </Card.Header>
                <Card.Content class="flex-1">
                    {#if !isConfirming}
                        {#if !data.selectedDate}
                            <p class="py-8 text-center text-sm text-muted-foreground">Selecione uma data para ver os horários.</p>
                        {:else if slots.length > 0}
                            <div class="grid grid-cols-2 gap-2">
                                {#each slots as slot}
                                    <Button
                                        variant={selectedSlot?.slot_start === slot.slot_start ? 'default' : 'outline'}
                                        class="h-12"
                                        onclick={() => (selectedSlot = slot)}
                                    >
                                        {formatSlotTime(slot.slot_start)}
                                    </Button>
                                {/each}
                            </div>
                        {:else}
                            <p class="py-8 text-center text-sm text-muted-foreground text-red-500">Nenhum horário disponível para este dia.</p>
                        {/if}
                    {:else}
                        <!-- FORMULÁRIO DE CHECKOUT (STREAK/APPLE STYLE) -->
                        <form
                            method="POST"
                            action="?/finishSelfBooking"
                            use:enhance={() => {
                                isLoading = true;
                                return async ({ result }) => {
                                    if (result.type === 'success' && result.data?.appointmentId) {
                                        await goto(`/${result.data.appointmentId}`, { replaceState: true });
                                    }
                                    isLoading = false;
                                };
                            }}
                            class="flex flex-col space-y-4 animate-in fade-in slide-in-from-right-4"
                        >
                            <input type="hidden" name="selected_date" value={data.selectedDate} />
                            <input type="hidden" name="slot_start" value={selectedSlot.slot_start} />
                            <input type="hidden" name="service_id" value={data.selectedServiceId} />
							<input type="hidden" name="profile_id" value={data.professional.id} />

                            <div class="rounded-lg bg-muted/50 p-3 text-sm">
                                <p><strong>{services.find(s => s.id === data.selectedServiceId)?.name}</strong></p>
                                <p class="text-muted-foreground">{data.selectedDate} às {formatSlotTime(selectedSlot.slot_start)}</p>
                            </div>

                            <div class="space-y-2">
                                <Label for="name">Seu nome</Label>
                                <Input id="name" name="customer_name" bind:value={customerName} required />
                            </div>

                            <div class="space-y-2">
                                <Label for="phone">WhatsApp</Label>
                                <Input id="phone" name="customer_phone" type="tel" bind:value={customerPhone} required />
                            </div>

                            <div class="flex gap-2 pt-4">
                                <Button variant="ghost" class="flex-1" onclick={() => (isConfirming = false)}>Voltar</Button>
                                <Button type="submit" class="flex-1" disabled={isLoading}>
                                    {#if isLoading}<LoaderCircle class="mr-2 animate-spin" />{/if}
                                    Reservar
                                </Button>
                            </div>
                        </form>
                    {/if}
                </Card.Content>
            </Card.Root>
        </div>
    {/if}
</div>