import { today, getLocalTimeZone } from '@internationalized/date';

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
	}),

	// Para cálculos de "agora" e "em X min"
	full: new Intl.DateTimeFormat('en-US', {
		timeZone: TIMEZONE,
		year: 'numeric',
		month: 'numeric',
		day: 'numeric',
		hour: 'numeric',
		minute: 'numeric',
		second: 'numeric',
		hour12: false
	})
};

/**
 * Utilitários de data
 */
export const dateUtils = {
	// Pega string ISO de hoje em SP: "2026-05-11"
	today: () => today(TIMEZONE).toString(),

	// Converte Date ou Ticker para string de hora: "14:30"
	toTime: (date: Date | number) => fmt.time.format(date),

	// Converte string "2026-05-11" para objeto Date real (evita erro de fuso local)
	parseISO: (isoString: string) => {
		const [y, m, d] = isoString.split('-').map(Number);
		return new Date(y, m - 1, d);
	},

	// Formata o label do header
	getHeaderLabel: (isoDate: string) => {
		if (isoDate === dateUtils.today()) return 'Hoje';
		return fmt.header.format(dateUtils.parseISO(isoDate));
	},

	// Cálculo de "em quanto tempo" (Label Soon)
	getSoonLabel: (startTime: string, ticker: number) => {
		const [h, m] = startTime.split(':').map(Number);
		const nowInSP = new Date(fmt.full.format(new Date(ticker)));
		const target = new Date(nowInSP);
		target.setHours(h, m, 0, 0);

		const diff = Math.floor((target.getTime() - nowInSP.getTime()) / 60000);

		if (diff <= 0 && diff > -30) return 'agora';
		if (diff < 60 && diff > 0) return `em ${diff} min`;
		return null;
	}
};
