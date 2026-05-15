import { today } from '@internationalized/date';

const TIMEZONE = 'America/Sao_Paulo';

// Formatadores estáveis (Instanciar uma vez é melhor para performance)
export const fmt = {
	// Retorna "2026-05-11"
	iso: new Intl.DateTimeFormat('sv-SE', { timeZone: TIMEZONE }),

	// Retorna "14:30"
	time: new Intl.DateTimeFormat('pt-BR', {
		timeZone: TIMEZONE,
		hour: '2-digit',
		minute: '2-digit',
		hour12: false
	}),

	// Retorna "seg., 11 de mai."
	header: new Intl.DateTimeFormat('pt-BR', {
		weekday: 'short',
		day: 'numeric',
		month: 'short',
		timeZone: TIMEZONE
	}),

	// Retorna "SEG"
	weekdayShort: new Intl.DateTimeFormat('pt-BR', {
		weekday: 'short',
		timeZone: TIMEZONE
	})
};

/**
 * Utilitários de data robustos para TSTZRANGE e Cloudflare Edge
 */
export const dateUtils = {
	// Pega string ISO de hoje em SP: "2026-05-11"
	today: () => today(TIMEZONE).toString(),

	// Converte Date ou Ticker (timestamp) para string de hora local de SP: "14:30"
	toTime: (date: Date | number) => fmt.time.format(date),

	// Converte string "2026-05-11" para objeto Date focado no meio do dia local de SP
	// (Evita que o fuso puxe a data para o dia anterior)
	parseISO: (isoString: string) => {
		const [y, m, d] = isoString.split('-').map(Number);
		// Forçar meio-dia evita problemas de fuso ao converter para manipulações puras de calendário
		return new Date(y, m - 1, d, 12, 0, 0);
	},

	// Formata o label do header
	getHeaderLabel: (isoDate: string) => {
		if (isoDate === dateUtils.today()) return 'Hoje';
		return fmt.header.format(dateUtils.parseISO(isoDate));
	},

	/**
	 * AJUSTADO: Faz o parse de um timestamp absoluto limpando aspas da serialização JSON do Postgres
	 */
	parseAbsoluteToMs: (dateInput: string | Date | number) => {
		if (typeof dateInput === 'number') return dateInput;
		if (dateInput instanceof Date) return dateInput.getTime();

		// Remove TODAS as aspas (inclusive as escapadas \") e normaliza o espaço para 'T'
		const normalized = dateInput.replace(/"/g, '').trim().replace(' ', 'T');
		return Date.parse(normalized);
	},

	/**
	 * CORRIGIDO: Força a string para o fuso -03:00 de Brasília de forma explícita.
	 * Isso blinda o comportamento na Cloudflare Edge (UTC) e no Navegador local.
	 */
	parseTimeToMs: (timeStr: string, selectedDateStr: string) => {
		// Ao cravar o sufixo -03:00, o motor do JS calcula os milissegundos UTC exatos,
		// não importando em qual fuso horário o servidor ou o cliente estão rodando.
		const isoWithTz = `${selectedDateStr}T${timeStr}:00-03:00`;
		return Date.parse(isoWithTz);
	},

	/**
	 * CORRIGIDO: Destrincha a string tstzrange limpando as aspas internas do JSON
	 * Entrada tratada: "[\"2026-05-15 12:00:00+00\",\"2026-05-15 12:30:00+00\")"
	 */
	parseRange: (rangeStr: string) => {
		// Remove colchetes, parênteses E aspas duplas de uma vez só
		const clean = rangeStr.replace(/[\[\]\(\)"]/g, '');
		const [startStr, endStr] = clean.split(',');

		const startMs = dateUtils.parseAbsoluteToMs(startStr);
		const endMs = dateUtils.parseAbsoluteToMs(endStr);

		return {
			start_at: dateUtils.toTime(startMs), // Agora vai aplicar os -3h de SP perfeitamente!
			end_at: dateUtils.toTime(endMs),
			startMs,
			endMs
		};
	},

	// Ajuste do getSoonLabel utilizando o novo parser absoluto
	getSoonLabel: (startMs: number, endMs: number, ticker: number) => {
		if (ticker >= startMs && ticker <= endMs) return 'agora';

		const diffMin = Math.floor((startMs - ticker) / 60000);

		if (diffMin <= 0) return null;
		if (diffMin < 60) return `em ${diffMin} min`;

		const diffHours = Math.floor(diffMin / 60);
		const remainingMin = diffMin % 60;
		return `em ${diffHours}h${remainingMin > 0 ? remainingMin : ''}`;
	},

	handleSelection: (date: any, currentPath: string) => {
		if (!date) return null;
		const dateString = date.toString();
		if (currentPath.includes('/agenda')) {
			return `/agenda?date=${dateString}`;
		}
		return dateString;
	}
};
