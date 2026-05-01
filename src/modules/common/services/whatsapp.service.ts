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

    constructor(private readonly configService: ConfigService) { }

    async sendMessage(input: SendWhatsAppMessageInput): Promise<boolean> {
        const apiUrl = this.configService.get<string>('WHATSAPP_API_URL')?.trim();
        const apiKey = this.configService.get<string>('WHATSAPP_API_KEY')?.trim();

        console.log(apiKey);
        console.log(apiUrl);

        if (!apiUrl || !apiKey) {
            console.warn('WhatsApp no configurado. Se omite el envio del mensaje.');
            return false;
        }

        const fromPhoneNumber = this.normalizePhoneNumber(input.fromPhoneNumber);
        const toPhoneNumber = this.normalizePhoneNumber(input.toPhoneNumber);

        if (!fromPhoneNumber || !toPhoneNumber) {
            console.warn('No se pudo enviar WhatsApp por numeros invalidos.');
            return false;
        }

        console.log("Numero de origen:", fromPhoneNumber);
        console.log("Numero de destino:", toPhoneNumber);
        console.log("Mensaje:", input.message);

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                },
                body: JSON.stringify({
                    fromPhoneNumber,
                    toPhoneNumber,
                    message: input.message,
                }),
            });



            const responseText = await response.text();

            console.log(`WhatsApp status: ${response.status}`);
            console.log(`WhatsApp response: ${responseText}`);

            return response.ok;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            console.error(`Error enviando WhatsApp: ${errorMessage}`);
            return false;
        }
    }

    private normalizePhoneNumber(value?: string | null): string | null {
        const normalized = value?.replace(/\D/g, '') ?? '';
        return normalized.length ? normalized : null;
    }
}
