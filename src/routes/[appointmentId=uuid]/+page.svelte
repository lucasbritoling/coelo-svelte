<script lang="ts">
    import { page } from '$app/state';
    import * as Card from '$lib/components/ui/card/index.js';
    import { Button } from '$lib/components/ui/button/index.js';
    import { 
        CircleCheckBig, 
        Calendar, 
        Clock, 
        User2, 
        Share, 
        ChevronLeft,
        Download
    } from '@lucide/svelte';
    import { fade, fly } from 'svelte/transition';

    let { data } = $props();
    const { appointment, professional } = data;

    let copied = $state(false);

    async function handleShare() {
        const shareData = {
            title: 'Meu Agendamento',
            text: `Confirmado: ${appointment.service_name} com ${professional.full_name}`,
            url: window.location.href
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.log('Share cancelled');
            }
        } else {
            await navigator.clipboard.writeText(window.location.href);
            copied = true;
            setTimeout(() => (copied = false), 2000);
        }
    }
</script>

<svelte:head>
    <title>Confirmado • {appointment.service_name}</title>
    <meta property="og:title" content="Agendamento Confirmado! ✅" />
    <meta property="og:description" content="{appointment.service_name} com {professional.full_name} em {appointment.date} às {appointment.time}." />
    <meta property="og:image" content="{page.url.origin}/icon-512-squared.png" />
    <meta name="twitter:card" content="summary" />
</svelte:head>

<div class="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a] flex flex-col items-center justify-center p-6 antialiased">
    
    <!-- Botão Voltar (Estilo Apple) -->
    <div class="mb-8 w-full max-w-sm flex justify-start">
        <a 
            href="/{professional.username}" 
            class="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
            <ChevronLeft class="size-4" />
            Nova reserva
        </a>
    </div>

    <main 
        in:fly={{ y: 20, duration: 600 }}
        class="w-full max-w-sm"
    >
        <!-- Forçamos o Root a ignorar paddings/gaps para o header sangrar -->
        <Card.Root class="overflow-hidden border-none !p-0 !gap-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] bg-white dark:bg-[#111]">
            
            <!-- Header Verde (Encostado no topo) -->
            <div class="bg-emerald-50/50 dark:bg-emerald-500/10 pt-12 pb-8 px-8 flex flex-col items-center border-b border-emerald-100/20">
                <div class="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white dark:bg-black shadow-sm text-emerald-500">
                    <CircleCheckBig class="size-7" />
                </div>
                <h1 class="text-xl font-semibold tracking-tight text-emerald-900 dark:text-emerald-400">Agendamento Confirmado</h1>
                <p class="text-[10px] font-bold text-emerald-700/60 dark:text-emerald-400/60 mt-1 uppercase tracking-[0.2em]">Recibo Digital</p>
            </div>

            <!-- Conteúdo do Ticket com padding controlado -->
            <div class="p-8 space-y-8">
                
                <!-- Profissional -->
                <div class="flex items-center gap-4">
                    <div class="size-10 rounded-full bg-muted flex items-center justify-center border shadow-sm overflow-hidden text-muted-foreground">
                         <User2 class="size-5" />
                    </div>
                    <div class="flex flex-col">
                        <span class="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">Profissional</span>
                        <span class="font-semibold text-foreground tracking-tight">{professional.full_name}</span>
                    </div>
                </div>

                <!-- Detalhes Grid -->
                <div class="grid grid-cols-2 gap-6 pt-2">
                    <div class="space-y-1">
                        <div class="flex items-center gap-1.5 text-muted-foreground">
                            <Calendar class="size-3.5" />
                            <span class="text-[10px] font-bold uppercase tracking-tight">Data</span>
                        </div>
                        <p class="text-sm font-semibold">{appointment.date}</p>
                    </div>
                    <div class="space-y-1 text-right">
                        <div class="flex items-center gap-1.5 text-muted-foreground justify-end">
                            <Clock class="size-3.5" />
                            <span class="text-[10px] font-bold uppercase tracking-tight">Horário</span>
                        </div>
                        <p class="text-sm font-semibold">{appointment.time}</p>
                    </div>
                </div>

                <!-- Serviço -->
                <div class="bg-muted/40 rounded-2xl p-4 border border-border/50">
                    <div class="flex flex-col">
                        <span class="text-[10px] font-bold text-muted-foreground uppercase tracking-tight mb-1">Serviço Selecionado</span>
                        <span class="text-base font-bold text-primary">{appointment.service_name}</span>
                    </div>
                </div>

            </div>

            <!-- Rodapé de Ações -->
            <div class="px-8 pb-8 flex flex-col gap-3">
                <Button 
                    variant="default" 
                    class="w-full h-12 rounded-xl font-semibold transition-all active:scale-[0.98]" 
                    onclick={handleShare}
                >
                    {#if copied}
                        <span in:fade>Copiado!</span>
                    {:else}
                        <Share class="mr-2 size-4" />
                        Compartilhar
                    {/if}
                </Button>
                
                <Button 
                    variant="ghost" 
                    class="w-full h-12 rounded-xl text-muted-foreground hover:text-foreground font-medium transition-all"
                    onclick={() => window.print()}
                >
                    <Download class="mr-2 size-4" />
                    Salvar Recibo
                </Button>
            </div>
        </Card.Root>

        <footer class="mt-8 text-center">
            <p class="text-[10px] font-medium text-muted-foreground/40 uppercase tracking-[0.3em]">
                Coelo • 2026
            </p>
        </footer>
    </main>
</div>

<style>
    @media print {
        :global(body) { background: white !important; }
        .min-h-screen { min-height: auto !important; padding: 0 !important; }
        button, a, footer { display: none !important; }
        main { max-width: 100% !important; }
        :global(.border-none) { border: 1px solid #eee !important; box-shadow: none !important; }
    }
</style>