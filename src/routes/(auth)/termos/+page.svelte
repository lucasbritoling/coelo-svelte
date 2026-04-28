<script lang="ts">
	import { ArrowLeft, Scale, ShieldCheck, FileText, UserCircle } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';
</script>

<div class="min-h-screen bg-background p-6 md:p-12">
	<div class="mx-auto max-w-3xl">
		<Button variant="ghost" href="/" class="mb-8 gap-2">
			<ArrowLeft class="size-4" />
			Voltar
		</Button>

		<header class="mb-12 space-y-4">
			<div class="flex items-center gap-3 text-primary">
				<Scale class="size-8" />
				<h1 class="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Termos de Uso</h1>
			</div>
			<p class="text-muted-foreground italic">
				Última atualização: {new Date().toLocaleDateString('pt-BR')}
			</p>
		</header>

		<article class="prose prose-slate dark:prose-invert max-w-none space-y-8">
			<section class="space-y-4">
				<div class="flex items-center gap-2 text-xl font-semibold">
					<FileText class="size-5 text-primary" />
					<h2>1. Aceitação dos Termos</h2>
				</div>
				<p class="leading-relaxed text-muted-foreground">
					Ao acessar e utilizar esta plataforma de agendamento, você concorda em cumprir e estar
					vinculado a estes Termos de Uso. Se você não concordar com qualquer parte destes termos,
					não deverá utilizar nossos serviços.
				</p>
			</section>

			<section class="space-y-4">
				<div class="flex items-center gap-2 text-xl font-semibold">
					<h2>2. Descrição do Serviço</h2>
				</div>
				<p class="leading-relaxed text-muted-foreground">
					Nossa plataforma atua como uma ferramenta de gestão e intermediação, permitindo que
					profissionais gerenciem seus horários e que clientes realizem agendamentos online.
					<strong>Não somos responsáveis</strong> pela execução, qualidade ou pagamento dos serviços prestados
					pelos profissionais cadastrados.
				</p>
			</section>

			<section class="space-y-4 rounded-xl border bg-muted/30 p-6">
				<div class="flex items-center gap-2 text-xl font-semibold text-foreground">
					<ShieldCheck class="size-5 text-primary" />
					<h2>3. Responsabilidades do Usuário</h2>
				</div>
				<ul class="list-inside list-disc space-y-2 text-muted-foreground">
					<li>Fornecer informações verdadeiras e atualizadas no cadastro.</li>
					<li>Manter a confidencialidade de suas credenciais de acesso.</li>
					<li>
						Honrar os horários agendados ou realizar o cancelamento com a antecedência mínima
						exigida pelo profissional.
					</li>
					<li>Não utilizar a plataforma para fins fraudulentos ou envio de spam.</li>
				</ul>
			</section>

			<section class="space-y-4">
				<h2 class="text-xl font-semibold">4. Cancelamentos e No-Show</h2>
				<p class="leading-relaxed text-muted-foreground">
					Cada profissional possui sua própria política de cancelamento. A plataforma apenas
					disponibiliza os meios para que essas regras sejam informadas. Eventuais reembolsos ou
					cobranças de taxas de cancelamento devem ser tratados diretamente entre o cliente e o
					profissional.
				</p>
			</section>

			<section class="space-y-4">
				<h2 class="text-xl font-semibold">5. Limitação de Responsabilidade</h2>
				<p class="leading-relaxed text-muted-foreground">
					Em nenhuma circunstância a plataforma será responsável por danos indiretos, incidentais ou
					punitivos, incluindo perda de lucros ou interrupção de negócios, decorrentes do uso ou da
					incapacidade de usar o serviço.
				</p>
			</section>

			<section class="space-y-4 border-t pt-8">
				<h2 class="text-xl font-semibold">6. Alterações nos Termos</h2>
				<p class="leading-relaxed text-muted-foreground">
					Reservamo-nos o direito de modificar estes termos a qualquer momento. Alterações entrarão
					em vigor imediatamente após a publicação na plataforma. O uso continuado após tais
					alterações constitui sua aceitação dos novos termos.
				</p>
			</section>

			<footer class="mt-12 text-center text-sm text-muted-foreground">
				<p>Dúvidas sobre os termos? Entre em contato com nosso suporte.</p>
			</footer>
		</article>
	</div>
</div>

<style>
	/* Estilização básica para manter o espaçamento sem precisar de plugin typography completo */
	h2 {
		color: hsl(var(--foreground));
	}
	p {
		margin-bottom: 1rem;
	}
</style>
