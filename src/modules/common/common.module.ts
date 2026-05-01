import { Module } from '@nestjs/common';
import { WhatsAppService } from './services/whatsapp.service';

@Module({
  providers: [WhatsAppService],
  exports: [WhatsAppService],
})
export class CommonModule {}
