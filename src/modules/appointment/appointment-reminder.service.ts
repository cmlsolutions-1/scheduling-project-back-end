import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Appointment } from './entity/appointment.entity';
import { AppointmentRepository } from './repositories/appointment.repository';
import { WhatsAppService } from '../common/services/whatsapp.service';

@Injectable()
export class AppointmentReminderService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(AppointmentReminderService.name);
    private intervalRef?: NodeJS.Timeout;
    private startupTimeoutRef?: NodeJS.Timeout;
    private isRunning = false;

    constructor(
        private readonly appointmentRepository: AppointmentRepository,
        private readonly whatsAppService: WhatsAppService,
        private readonly configService: ConfigService,
    ) {}

    onModuleInit() {
        if (!this.isEnabled()) {
            this.logger.log('Recordatorios de citas por WhatsApp deshabilitados.');
            return;
        }

        const startupDelayMs = this.getStartupDelayMs();
        this.startupTimeoutRef = setTimeout(() => {
            void this.runSafely();
        }, startupDelayMs);

        this.intervalRef = setInterval(() => {
            void this.runSafely();
        }, this.getIntervalMs());
    }

    onModuleDestroy() {
        if (this.startupTimeoutRef) {
            clearTimeout(this.startupTimeoutRef);
        }

        if (this.intervalRef) {
            clearInterval(this.intervalRef);
        }
    }

    private async runSafely() {
        if (this.isRunning) {
            return;
        }

        this.isRunning = true;

        try {
            await this.sendDueReminders();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Error desconocido';
            this.logger.error(`Fallo el job de recordatorios de citas: ${message}`);
        } finally {
            this.isRunning = false;
        }
    }

    private async sendDueReminders() {
        const now = new Date();
        const targetHours = this.getTargetHours();
        const toleranceMinutes = this.getToleranceMinutes();

        const from = new Date(now.getTime() + (targetHours * 60 - toleranceMinutes) * 60 * 1000);
        const to = new Date(now.getTime() + (targetHours * 60 + toleranceMinutes) * 60 * 1000);

        const appointments = await this.appointmentRepository.findPendingClientReminders(from, to);

        for (const appointment of appointments) {
            const sent = await this.sendReminder(appointment);
            if (!sent) {
                continue;
            }

            appointment.clientReminderSentAt = new Date();
            await this.appointmentRepository.save(appointment);
        }
    }

    private async sendReminder(appointment: Appointment): Promise<boolean> {
        const companyPhone = appointment.company?.whatsappPhoneNumber;
        const clientPhone = appointment.client?.phone;

        if (!companyPhone || !clientPhone) {
            return false;
        }

        const message = this.buildRandomReminderMessage(appointment);

        return this.whatsAppService.sendMessage({
            fromPhoneNumber: companyPhone,
            toPhoneNumber: clientPhone,
            message,
        });
    }

    private buildRandomReminderMessage(appointment: Appointment): string {
        const clientName = appointment.client.name;
        const companyName = appointment.company.name;
        const serviceName = appointment.service.name;
        const employeeName = appointment.employee?.name;
        const scheduledDate = this.formatDate(appointment.scheduledAt);
        const scheduledTime = this.formatTime(appointment.scheduledAt);
        const employeeLine = employeeName ? `\n\u{1F487} Profesional: *${employeeName}*` : '';

        const messages = [
            `\u{23F0} Hola ${clientName}, te recordamos que tu cita en *${companyName}* es en aproximadamente 12 horas.\n\n\u{1F4C5} Fecha: *${scheduledDate}*\n\u{23F0} Hora: *${scheduledTime}*\n\u{1F485} Servicio: *${serviceName}*${employeeLine}\n\nTe esperamos \u{2728}`,
            `\u{2705} Recordatorio de cita\n\nHola ${clientName}, tu reserva en *${companyName}* se acerca.\n\n\u{1F4C5} Fecha: *${scheduledDate}*\n\u{23F0} Hora: *${scheduledTime}*\n\u{1F485} Servicio: *${serviceName}*${employeeLine}\n\nSi necesitas cambios, escribenos por este medio.`,
            `\u{1F389} Hola ${clientName}.\n\nQueremos recordarte que en unas 12 horas tienes cita en *${companyName}*.\n\n\u{1F4C5} Fecha: *${scheduledDate}*\n\u{23F0} Hora: *${scheduledTime}*\n\u{1F485} Servicio: *${serviceName}*${employeeLine}\n\nGracias por elegirnos \u{1F90D}`,
            `\u{2728} Tu cita se acerca, ${clientName}.\n\nEn *${companyName}* te esperamos pronto.\n\n\u{1F4C5} Fecha: *${scheduledDate}*\n\u{23F0} Hora: *${scheduledTime}*\n\u{1F485} Servicio reservado: *${serviceName}*${employeeLine}\n\nNos vemos pronto \u{1F64C}`,
            `\u{1F514} Recordatorio amistoso\n\nHola ${clientName}, tu cita en *${companyName}* esta programada para dentro de unas 12 horas.\n\n\u{1F4C5} Fecha: *${scheduledDate}*\n\u{23F0} Hora: *${scheduledTime}*\n\u{1F485} Servicio: *${serviceName}*${employeeLine}\n\nTe esperamos con gusto.`,
        ];

        return messages[Math.floor(Math.random() * messages.length)];
    }

    private formatDate(value: Date): string {
        return new Intl.DateTimeFormat('es-CO', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        }).format(new Date(value));
    }

    private formatTime(value: Date): string {
        return new Intl.DateTimeFormat('es-CO', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        }).format(new Date(value));
    }

    private isEnabled(): boolean {
        const disabledRaw = this.configService.get<string>('APPOINTMENT_REMINDER_DISABLED');
        if (disabledRaw?.trim()) {
            return disabledRaw.trim().toLowerCase() !== 'true';
        }

        const enabledRaw = this.configService.get<string>('APPOINTMENT_REMINDER_ENABLED');
        if (!enabledRaw?.trim()) {
            return true;
        }

        return enabledRaw.trim().toLowerCase() !== 'false';
    }

    private getIntervalMs(): number {
        const minutes = Number(this.configService.get<string>('APPOINTMENT_REMINDER_INTERVAL_MINUTES') ?? 30);
        return Math.max(1, minutes) * 60 * 1000;
    }

    private getTargetHours(): number {
        const hours = Number(this.configService.get<string>('APPOINTMENT_REMINDER_TARGET_HOURS') ?? 12);
        return hours > 0 ? hours : 12;
    }

    private getToleranceMinutes(): number {
        const minutes = Number(this.configService.get<string>('APPOINTMENT_REMINDER_TOLERANCE_MINUTES') ?? 30);
        return minutes >= 0 ? minutes : 30;
    }

    private getStartupDelayMs(): number {
        const seconds = Number(this.configService.get<string>('APPOINTMENT_REMINDER_STARTUP_DELAY_SECONDS') ?? 15);
        return Math.max(0, seconds) * 1000;
    }
}
