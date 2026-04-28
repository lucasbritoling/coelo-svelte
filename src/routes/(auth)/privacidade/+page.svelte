<script lang="ts">
	import { ArrowLeft, Scale, Eye, Database, Lock, UserCheck } from '@lucide/svelte';
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
				<h1 class="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
					Política de Privacidade
				</h1>
			</div>
			<p class="text-muted-foreground italic">
				Última atualização: {new Date().toLocaleDateString('pt-BR')}
			</p>
		</header>

		<article class="prose prose-slate dark:prose-invert max-w-none space-y-8">
			<p class="leading-relaxed text-muted-foreground">
				Esta Política de Privacidade descreve como recolhemos, utilizamos e protegemos as suas
				informações ao utilizar a nossa plataforma de agendamentos. Comprometemo-nos a garantir que
				a sua privacidade está protegida.
			</p>

			<section class="space-y-4">
				<div class="flex items-center gap-2 text-xl font-semibold">
					<Database class="size-5 text-primary" />
					<h2>1. Informações que Recolhemos</h2>
				</div>
				<div class="space-y-2 text-muted-foreground">
					<p>Recolhemos apenas os dados estritamente necessários para a prestação do serviço:</p>
					<ul class="ml-4 list-inside list-disc space-y-1">
						<li>
							<strong>Profissionais:</strong> Nome, e-mail, foto de perfil e informações sobre os serviços
							oferecidos.
						</li>
						<li>
							<strong>Clientes:</strong> Nome, número de telefone (WhatsApp) e e-mail para confirmação
							de agendamentos.
						</li>
						<li>
							<strong>Dados de Utilização:</strong> Cookies técnicos para manter a sessão ativa (via Supabase
							Auth).
						</li>
					</ul>
				</div>
			</section>

			<section class="space-y-4">
				<div class="flex items-center gap-2 text-xl font-semibold">
					<Eye class="size-5 text-primary" />
					<h2>2. Como Utilizamos os seus Dados</h2>
				</div>
				<p class="leading-relaxed text-muted-foreground">
					Os dados recolhidos são utilizados exclusivamente para:
				</p>
				<ul class="list-inside list-disc space-y-2 text-muted-foreground">
					<li>Viabilizar a marcação de horários entre cliente e profissional.</li>
					<li>Enviar notificações de confirmação ou cancelamento via WhatsApp/E-mail.</li>
					<li>Garantir a segurança da sua conta e prevenir fraudes.</li>
				</ul>
			</section>

			<section class="space-y-4 rounded-xl border bg-muted/30 p-6">
				<div class="flex items-center gap-2 text-xl font-semibold text-foreground">
					<Lock class="size-5 text-primary" />
					<h2>3. Segurança e Armazenamento</h2>
				</div>
				<p class="leading-relaxed text-muted-foreground">
					Os seus dados são armazenados de forma segura utilizando a infraestrutura do <strong
						>Supabase (Google Cloud/AWS)</strong
					>, com criptografia de ponta e práticas rigorosas de segurança. Não vendemos nem
					partilhamos os seus dados pessoais com terceiros para fins de marketing.
				</p>
			</section>

			<section class="space-y-4">
				<div class="flex items-center gap-2 text-xl font-semibold">
					<UserCheck class="size-5 text-primary" />
					<h2>4. Os Seus Direitos (LGPD)</h2>
				</div>
				<p class="leading-relaxed text-muted-foreground">
					De acordo com a Lei Geral de Proteção de Dados, tem o direito de:
				</p>
				<ul class="list-inside list-disc space-y-2 text-muted-foreground">
					<li>Acessar seus dados pessoais que detemos.</li>
					<li>Solicitar a correção de dados incompletos ou inexatos.</li>
					<li>
						Solicitar a <strong>eliminação total</strong> dos seus dados da nossa base de dados a qualquer
						momento.
					</li>
				</ul>
			</section>

			<section class="space-y-4 border-t pt-8">
				<h2 class="text-xl font-semibold">5. Cookies</h2>
				<p class="leading-relaxed text-muted-foreground">
					Utilizamos apenas cookies essenciais para o funcionamento do sistema (autenticação). Não
					utilizamos cookies de rastreio de terceiros ou publicidade direcionada.
				</p>
			</section>

			<footer class="mt-12 border-t pt-6 text-center text-sm text-muted-foreground">
				<p>Ao utilizar o nosso serviço, declara estar ciente destas práticas de privacidade.</p>
			</footer>
		</article>
	</div>
</div>

<style>
	h2 {
		color: hsl(var(--foreground));
	}
	p {
		margin-bottom: 1rem;
	}
</style>
