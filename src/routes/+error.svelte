<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import { FileQuestionMark, ArrowLeft } from '@lucide/svelte';
</script>

<div class="flex min-h-svh flex-col items-center justify-center p-6 text-center">
	<div class="mb-4 flex size-20 items-center justify-center rounded-full bg-muted">
		<FileQuestionMark class="size-10 text-muted-foreground" />
	</div>

	<h1 class="text-4xl font-bold tracking-tight">
		{page.status === 404 ? 'Página não encontrada' : 'Ocorreu um erro'}
	</h1>

	<p class="mt-4 max-w-md text-lg text-muted-foreground">
		A página que você está procurando não existe ou foi movida.
	</p>

	<div class="mt-8 flex gap-4">
		<Button variant="outline" onclick={() => history.back()}>
			<ArrowLeft class="mr-2 size-4" />
			Voltar
		</Button>
		<Button href="/">Ir para o Início</Button>
	</div>
</div>
