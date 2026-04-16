import { BadRequestException, Body, Controller, Post, Request, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/guards/jwt/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorators';
import { ApiCommonErrors } from '../common/decorators/swagger/api-helper-errors';
import { ApiCreatedWrapped } from '../common/decorators/swagger/api-wrapped-response.decorator';
import { ResponseMediaDto } from './dto/response-media.dto';
import { UploadImageDto } from './dto/upload-image.dto';
import { MediaService } from './media.service';

@Controller('media')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('jwt')
export class MediaController {
    constructor(private readonly service: MediaService) { }

    @Post('images')
    @Roles('SUPER_ADMIN', 'ADMIN')
    @UseInterceptors(FileInterceptor('file', {
        storage: memoryStorage(),
        limits: { fileSize: 5 * 1024 * 1024 },
        fileFilter: (_req, file, callback) => {
            if (!file.mimetype?.startsWith('image/')) {
                return callback(new BadRequestException('Solo se permiten imagenes'), false);
            }
            callback(null, true);
        },
    }))
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
                companyId: {
                    type: 'string',
                    format: 'uuid',
                    nullable: true,
                },
            },
            required: ['file'],
        },
    })
    @ApiCreatedWrapped(ResponseMediaDto, 'Imagen subida')
    @ApiCommonErrors()
    uploadImage(
        @UploadedFile() file: any,
        @Body() dto: UploadImageDto,
        @Request() req,
    ) {
        const tenantId = req.user.role === 'ADMIN' ? req.tenant?.id : (dto.companyId ?? req.tenant?.id);

        if (req.user.role === 'ADMIN') {
            if (!tenantId) throw new BadRequestException('Empresa no identificada');
            if (req.user.companyId && req.user.companyId !== tenantId) {
                throw new BadRequestException('Empresa no coincide con la sesion activa');
            }
        }

        if (!tenantId) {
            throw new BadRequestException('companyId es requerido');
        }

        return this.service.createImage(file, tenantId, req.user.id);
    }
}
