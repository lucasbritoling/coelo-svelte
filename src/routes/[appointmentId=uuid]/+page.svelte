<!--src/routes/[appointmentId]/+page.svelte --> 
<script lang="ts">
    import { page } from '$app/state';
    import * as Card from '$lib/components/ui/card/index.js';
    import { Button } from '$lib/components/ui/button/index.js';
    import { CircleCheckBig, CalendarCheck2, User, Share2 } from '@lucide/svelte';

    let { data } = $props();
    const { appointment, professional } = data;
</script>

<svelte:head>
    <title>Confirmado: {appointment.service_name}</title>
    
    <!-- Metadados de compartilhamento otimizados -->
    <meta property="og:title" content="Agendamento Confirmado! ✅" />
    <meta property="og:description" content="{appointment.service_name} com {professional.full_name} em {appointment.date} às {appointment.time}." />
    
    <!-- Ícone fixo do App -->
    <meta property="og:image" content="{page.url.origin}/icon-512-squared.png" />
    <meta property="og:image:width" content="512" />
    <meta property="og:image:height" content="512" />
    
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:image" content="{page.url.origin}/icon-512-squared.png" />
</svelte:head>

<div class="mx-auto flex min-h-[80vh] max-w-sm flex-col items-center justify-center p-6">
    <Card.Root class="w-full">
        <Card.Content class="pt-10 text-center">
            <div class="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <CircleCheckBig class="h-10 w-10" />
            </div>
            
            <h1 class="text-xl font-bold tracking-tight">Tudo pronto!</h1>
            <p class="text-sm text-muted-foreground">Seu agendamento foi confirmado.</p>

            <div class="mt-8 space-y-4 text-left border-t pt-6">
                <div class="flex items-center gap-3">
                    <User class="h-4 w-4 text-muted-foreground" />
                    <span class="text-sm font-medium">{professional.full_name}</span>
                </div>
                <div class="flex items-center gap-3">
                    <CalendarCheck2 class="h-4 w-4 text-muted-foreground" />
                    <span class="text-sm font-medium">{appointment.service_name}</span>
                </div>
                <div class="text-center bg-muted/50 rounded-lg py-3">
                    <span class="text-lg font-bold">{appointment.date} às {appointment.time}</span>
                </div>
            </div>

            <div class="mt-8">
                <Button class="w-full gap-2" variant="outline" onclick={() => window.print()}>
                    Salvar Recibo
                </Button>
            </div>
        </Card.Content>
    </Card.Root>
</div>