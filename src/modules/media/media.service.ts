import { Inject, BadRequestException, Injectable, InternalServerErrorException, NotFoundException, Optional } from '@nestjs/common';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { dirname, extname, join } from 'path';
import { Repository } from 'typeorm';
import { ResponseMediaDto } from './dto/response-media.dto';
import { Media, MediaKind } from './entity/media.entity';

type SpacesConfig = {
    bucket: string;
    publicBaseUrl: string;
};

const MEDIA_FOLDER = 'Imagenes';

@Injectable()
export class MediaService {
    constructor(
        @InjectRepository(Media)
        private readonly mediaRepo: Repository<Media>,
        private readonly configService: ConfigService,
        @Optional()
        @Inject('S3_CLIENT')
        private readonly s3Client: S3Client | null,
    ) { }

    async createImage(file: any, companyId: string, authorId: string): Promise<ResponseMediaDto> {
        if (!file) {
            throw new BadRequestException('file es requerido');
        }

        const contentHash = this.sha256Hex(file.buffer);
        const existingMedia = await this.mediaRepo.findOne({
            where: {
                kind: MediaKind.IMAGE,
                company: { id: companyId },
                contentHash,
            },
        });

        if (existingMedia) {
            return this.toResponse(existingMedia);
        }

        const { fileName, url } = await this.storeImage(file, companyId, contentHash);

        const media = this.mediaRepo.create({
            kind: MediaKind.IMAGE,
            originalName: file.originalname,
            fileName,
            mimeType: file.mimetype,
            size: file.size,
            url,
            contentHash,
            company: { id: companyId } as any,
            createdBy: authorId,
            updatedBy: authorId,
        });

        try {
            const saved = await this.mediaRepo.save(media);
            return this.toResponse(saved);
        } catch (error) {
            const duplicatedMedia = await this.mediaRepo.findOne({
                where: {
                    kind: MediaKind.IMAGE,
                    company: { id: companyId },
                    contentHash,
                },
            });

            if (duplicatedMedia) {
                return this.toResponse(duplicatedMedia);
            }

            throw error;
        }
    }

    async resolveImageForCompany(imageId: string | null | undefined, companyId?: string): Promise<Media | null | undefined> {
        if (imageId === undefined) return undefined;
        if (imageId === null) return null;

        if (!companyId) {
            throw new BadRequestException('No se puede asociar imagen sin empresa');
        }

        const media = await this.mediaRepo.findOne({
            where: { id: imageId, kind: MediaKind.IMAGE, company: { id: companyId } },
        });

        if (!media) {
            throw new NotFoundException('Imagen no encontrada');
        }

        return media;
    }

    private async storeImage(file: any, companyId: string, contentHash: string): Promise<{ fileName: string; url: string }> {
        if (!file.buffer || !Buffer.isBuffer(file.buffer)) {
            throw new BadRequestException('Archivo invalido');
        }

        const extension = this.resolveExtension(file.originalname, file.mimetype);
        const objectKey = `${MEDIA_FOLDER}/companies/${companyId}/images/${contentHash}${extension}`;
        const spacesConfig = this.getSpacesConfig();

        if (spacesConfig && this.s3Client) {
            await this.uploadToSpaces(file.buffer, file.mimetype, objectKey, spacesConfig);
            return {
                fileName: objectKey,
                url: `${spacesConfig.publicBaseUrl}/${objectKey}`,
            };
        }

        const uploadsRoot = join(process.cwd(), 'uploads', 'media');
        const localFilePath = join(uploadsRoot, ...objectKey.split('/'));
        await mkdir(dirname(localFilePath), { recursive: true });
        await writeFile(localFilePath, file.buffer);

        return {
            fileName: objectKey,
            url: `/uploads/media/${objectKey}`,
        };
    }

    private resolveExtension(originalName?: string, mimeType?: string): string {
        const extension = extname(originalName || '').toLowerCase();
        if (extension) {
            return extension;
        }

        const mimeExtensions: Record<string, string> = {
            'image/jpeg': '.jpg',
            'image/png': '.png',
            'image/webp': '.webp',
            'image/gif': '.gif',
            'image/svg+xml': '.svg',
        };

        return mimeExtensions[mimeType || ''] || '';
    }

    private getSpacesConfig(): SpacesConfig | null {
        const bucket = this.readEnv('SPACES_BUCKET', 'DO_SPACES_BUCKET');
        const accessKey = this.readEnv('SPACES_KEY', 'DO_SPACES_KEY', 'SPACES_ACCESS_KEY', 'SPACES_ACCESS_KEY_ID');
        const secretKey = this.readEnv('SPACES_SECRET', 'DO_SPACES_SECRET', 'SPACES_SECRET_KEY', 'SPACES_SECRET_ACCESS_KEY');
        const publicUrl = this.readEnv('SPACES_URL_CDN', 'DO_SPACES_CDN_URL', 'SPACES_CDN_URL');

        const providedCount = [bucket, accessKey, secretKey, publicUrl].filter(Boolean).length;

        if (!providedCount) {
            return null;
        }

        if (!bucket || !accessKey || !secretKey || !publicUrl) {
            throw new InternalServerErrorException('Configuracion incompleta de DigitalOcean Spaces');
        }

        return {
            bucket: bucket as string,
            publicBaseUrl: this.normalizePublicBaseUrl(publicUrl) as string,
        };
    }

    private async uploadToSpaces(
        buffer: Buffer,
        contentType: string | undefined,
        objectKey: string,
        config: SpacesConfig,
    ): Promise<void> {
        if (!this.s3Client) {
            throw new InternalServerErrorException('Cliente de DigitalOcean Spaces no configurado');
        }

        try {
            const upload = new Upload({
                client: this.s3Client,
                params: {
                    Bucket: config.bucket,
                    Key: objectKey,
                    Body: buffer,
                    ContentType: contentType || 'application/octet-stream',
                    ACL: 'public-read',
                },
            });

            await upload.done();
        } catch (error: any) {
            throw new InternalServerErrorException(
                `Error subiendo imagen a DigitalOcean Spaces: ${error?.message ?? 'Error desconocido'}`,
            );
        }
    }

    private normalizePublicBaseUrl(value?: string | null): string | null {
        if (!value) return null;
        return value.replace(/\/+$/, '');
    }

    private readEnv(...keys: string[]): string | undefined {
        for (const key of keys) {
            const value = this.configService.get<string>(key);
            if (value?.trim()) {
                return value.trim();
            }
        }

        return undefined;
    }

    private sha256Hex(value: string | Buffer): string {
        return createHash('sha256').update(value).digest('hex');
    }

    private toResponse(media: Media): ResponseMediaDto {
        return {
            id: media.id,
            kind: media.kind,
            originalName: media.originalName,
            fileName: media.fileName,
            mimeType: media.mimeType,
            size: media.size,
            url: media.url,
            companyId: media.companyId,
        };
    }
}
