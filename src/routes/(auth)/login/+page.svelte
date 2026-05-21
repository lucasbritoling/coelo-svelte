<script lang="ts">
	import LoginForm from '$lib/components/login-form.svelte';
	import { toast } from 'svelte-sonner';
	import { fade } from 'svelte/transition';

	let { data, form } = $props();

	$effect(() => {
		if (data.successMessage) {
			toast.success(data.successMessage);

			const url = new URL(window.location.href);
			url.searchParams.delete('message');
			window.history.replaceState({}, '', url.toString());
		}
	});
</script>

<div
	class="flex h-svh flex-col items-center justify-center overflow-y-auto bg-[#fafafa] p-4 sm:overflow-hidden sm:p-6 md:p-10"
>
	<header class="mb-4 flex flex-col items-center gap-2 sm:mb-8" in:fade={{ duration: 200 }}>
		<a
			href="/"
			class="flex items-center gap-2.5 font-sans font-semibold tracking-tight text-[#0a0a0a]"
		>
			<div class="flex size-7 items-center justify-center overflow-hidden rounded-lg bg-[#0a0a0a]">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 1024 1024"
					class="size-full fill-white"
				>
					<path
						d="m509 761-182-96c-3-6 5-41 13-61q25-63 83-106l13-10-8-3q-61-18-111-55c-13-10-37-34-46-47s-19-31-24-44c-3-9-4-13-4-21q-1-21 20-29c47-21 152 26 212 94 17 19 21 25 41 54l18 25q5 1 6-4a257 257 0 0 0-64-103q-47-47-104-68-15-4-16-7c0-3 5-11 11-16 20-19 57-18 99 2q50 24 83 72c13 18 31 57 38 80l2 7h6c28 0 63 11 91 28 32 19 64 51 87 86 9 14 9 18 5 34-8 31-33 60-67 77-16 9-25 12-54 19-27 7-42 12-55 20q-40 26-55 69-4 15-10 15-2 2-28-12"
					/>
				</svg>
			</div>
			<span class="text-base tracking-normal">Coelo</span>
		</a>
	</header>

	<div class="w-full max-w-sm">
		<LoginForm {form} />
	</div>
</div>
