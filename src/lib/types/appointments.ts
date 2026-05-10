export type AppointmentStatus = 'confirmed' | 'pending' | 'cancelled';

export interface Appointment {
	id: string;
	status: AppointmentStatus;
	start_at: string; // Vem do to_char(lower(a.slot)...)
	end_at: string; // Vem do to_char(upper(a.slot)...)
	customer_name: string;
	service_name: string;
	service_duration: string; // Interval ou string vinda do DB
	customer_phone?: string; // Caso você adicione no SELECT depois
}
