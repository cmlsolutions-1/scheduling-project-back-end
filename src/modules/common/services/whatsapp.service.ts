import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type SendWhatsAppMessageInput = {
    fromPhoneNumber: string;
    toPhoneNumber: string;
    message: string;
};

@Injectable()
export class WhatsAppService {
    private readonly logger = new Logger(WhatsAppService.name);
    private static readonly INFORMATIVE_FOOTER = '\n\n\u{26A0} *Este es un mensaje informativo.*\nPor favor no responder este mensaje.';

    constructor(private readonly configService: ConfigService) { }

    async sendMessage(input: SendWhatsAppMessageInput): Promise<boolean> {
        const apiUrl = this.configService.get<string>('WHATSAPP_API_URL')?.trim();
        const apiKey = this.configService.get<string>('WHATSAPP_API_KEY')?.trim();

        if (!apiUrl || !apiKey) {
            this.logger.warn('WhatsApp no configurado. Se omite el envio del mensaje.');
            return false;
        }

        const fromPhoneNumber = this.normalizePhoneNumber(input.fromPhoneNumber);
        const toPhoneNumber = this.normalizePhoneNumber(input.toPhoneNumber);

        if (!fromPhoneNumber || !toPhoneNumber) {
            this.logger.warn('No se pudo enviar WhatsApp por numeros invalidos.');
            return false;
        }

        try {
            const message = this.appendInformativeFooter(input.message);

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                },
                body: JSON.stringify({
                    fromPhoneNumber,
                    toPhoneNumber,
                    message,
                }),
            });



            const responseText = await response.text();

            this.logger.log(`WhatsApp status: ${response.status}`);
            this.logger.debug(`WhatsApp response: ${responseText}`);

            return response.ok;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            this.logger.error(`Error enviando WhatsApp: ${errorMessage}`);
            return false;
        }
    }

    private normalizePhoneNumber(value?: string | null): string | null {
        const normalized = value?.replace(/\D/g, '') ?? '';
        return normalized.length ? normalized : null;
    }

    private appendInformativeFooter(message: string): string {
        const normalizedMessage = message.trimEnd();
        const footerText = 'por favor no responder este mensaje';

        if (normalizedMessage.toLowerCase().includes(footerText)) {
            return normalizedMessage;
        }

        return `${normalizedMessage}${WhatsAppService.INFORMATIVE_FOOTER}`;
    }
}
