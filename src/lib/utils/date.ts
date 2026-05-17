import { today } from '@internationalized/date';

// Fallback padrão seguro para o sistema
export const DEFAULT_TZ = 'America/Sao_Paulo';

/**
 * Gerador dinâmico de formatadores para evitar overhead e respeitar o fuso do cliente
 */
export const createFormatters = (tz: string = DEFAULT_TZ) => ({
	iso: new Intl.DateTimeFormat('sv-SE', { timeZone: tz }),

	time: new Intl.DateTimeFormat('pt-BR', {
		timeZone: tz,
		hour: '2-digit',
		minute: '2-digit',
		hour12: false
	}),

	header: new Intl.DateTimeFormat('pt-BR', {
		weekday: 'short',
		day: 'numeric',
		month: 'short',
		timeZone: tz
	})
});

export const dateUtils = {
	// Pega a string ISO de hoje baseada no fuso dinâmico
	today: (tz: string = DEFAULT_TZ) => today(tz).toString(),

	// Converte timestamps para a hora local do fuso informado
	toTime: (date: Date | number, tz: string = DEFAULT_TZ) => {
		return createFormatters(tz).time.format(date);
	},

	// Converte string para data focando no meio do dia para isolar problemas de fuso no calendário
	parseISO: (isoString: string) => {
		const [y, m, d] = isoString.split('-').map(Number);
		return new Date(y, m - 1, d, 12, 0, 0);
	},

	getHeaderLabel: (isoDate: string, tz: string = DEFAULT_TZ) => {
		const todayStr = dateUtils.today(tz);
		if (isoDate === todayStr) return 'Hoje';

		const formatters = createFormatters(tz);

		// 1. Convertemos o "Hoje" do fuso para um objeto Date (travado às 12h)
		const todayDate = dateUtils.parseISO(todayStr);

		// 2. Calculamos Ontem (-24h) e pegamos a string ISO limpa correspondente
		const yesterdayDate = new Date(todayDate.getTime() - 24 * 60 * 60 * 1000);
		const yesterdayStr = formatters.iso.format(yesterdayDate);
		if (isoDate === yesterdayStr) return 'Ontem';

		// 3. Calculamos Amanhã (+24h) e pegamos a string ISO limpa correspondente
		const tomorrowDate = new Date(todayDate.getTime() + 24 * 60 * 60 * 1000);
		const tomorrowStr = formatters.iso.format(tomorrowDate);
		if (isoDate === tomorrowStr) return 'Amanhã';

		// Fallback para os demais dias (ex: "qui., 23 de mai.")
		return formatters.header.format(dateUtils.parseISO(isoDate));
	},

	parseAbsoluteToMs: (dateInput: string | Date | number) => {
		if (typeof dateInput === 'number') return dateInput;
		if (dateInput instanceof Date) return dateInput.getTime();

		const normalized = dateInput.replace(/"/g, '').trim().replace(' ', 'T');
		return Date.parse(normalized);
	},

	/**
	 * DINÂMICO: Descobre o offset em milissegundos do fuso ativo e calcula o tempo correto
	 */
	parseTimeToMs: (timeStr: string, selectedDateStr: string, tz: string = DEFAULT_TZ) => {
		// Cria uma data pura na timezone informada
		const targetDateStr = `${selectedDateStr}T${timeStr}:00`;
		const dateWithTz = new Date(new Date(targetDateStr).toLocaleString('en-US', { timeZone: tz }));
		return dateWithTz.getTime();
	},

	/**
	 * Usado APENAS se você receber o tstzrange bruto do banco (string com colchetes).
	 * Se os dados vierem da nova RPC, use direto os campos start_at e end_at textuais!
	 */
	parseRange: (rangeStr: string, tz: string = DEFAULT_TZ) => {
		const clean = rangeStr.replace(/[\[\]\(\)"]/g, '');
		const [startStr, endStr] = clean.split(',');

		const startMs = dateUtils.parseAbsoluteToMs(startStr);
		const endMs = dateUtils.parseAbsoluteToMs(endStr);

		return {
			start_at: dateUtils.toTime(startMs, tz),
			end_at: dateUtils.toTime(endMs, tz),
			startMs,
			endMs
		};
	},

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
