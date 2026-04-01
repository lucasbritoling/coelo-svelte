<script lang="ts">
	import ForgotPasswordForm from './forgot-password-form.svelte';
	let { data } = $props();
</script>

<ForgotPasswordForm data={data.form} />
