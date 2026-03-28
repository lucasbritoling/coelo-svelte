<script>
	import { CalendarDate, parseDate } from '@internationalized/date';

	// Criando um estado reativo com uma data inicial
	let dataSelecionada = $state(new CalendarDate(2024, 12, 25));

	// Ou convertendo uma string que veio de algum lugar
	let dataDaApi = parseDate('2024-01-01');
</script>

<p>A data escolhida é: {dataDaApi.toString()}</p>
