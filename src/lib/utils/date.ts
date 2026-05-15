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
	parseTimeToMs: (timeStr: string, ticker: number) => {
		const [h, m] = timeStr.split(':').map(Number);
		const d = new Date(ticker);
		d.setHours(h, m, 0, 0);
		return d.getTime();
	},

	// Ajuste opcional no getSoonLabel para usar o ticker de forma mais consistente
	getSoonLabel: (startTime: string, endTime: string, ticker: number) => {
		const start = dateUtils.parseTimeToMs(startTime, ticker);
		const end = dateUtils.parseTimeToMs(endTime, ticker);

		if (ticker >= start && ticker <= end) return 'agora';

		const diffMin = Math.floor((start - ticker) / 60000);

		if (diffMin <= 0) return null;
		if (diffMin < 60) return `em ${diffMin} min`;

		const diffHours = Math.floor(diffMin / 60);
		const remainingMin = diffMin % 60;
		return `em ${diffHours}h${remainingMin > 0 ? remainingMin : ''}`;
	},
	handleSelection: (date: any, currentPath: string) => {
		if (!date) return null;

		const dateString = date.toString();

		// Se estiver na agenda, retorna o destino da navegação
		if (currentPath.includes('/agenda')) {
			return `/agenda?date=${dateString}`;
		}

		// Caso contrário, apenas retorna a string para atualizar estados locais
		return dateString;
	}
};
