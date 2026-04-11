<script>
	import SignupForm from '$lib/components/signup-form.svelte';
	let { data } = $props();
</script>

<div class="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
	<div class="flex w-full max-w-sm flex-col gap-6">
		<a href="##" class="flex items-center gap-2 self-center font-medium">
			<div class="flex size-6 items-center justify-center overflow-hidden rounded-md bg-primary">
				<img src="/icon-192.png" alt="Coelo Logo" class="size-full object-cover" />
			</div>
			Coelo
		</a>
		<SignupForm data={data.form} />
	</div>
</div>
