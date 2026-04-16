import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, createHmac } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { request } from 'https';
import { dirname, extname, join } from 'path';
import { Repository } from 'typeorm';
import { ResponseMediaDto } from './dto/response-media.dto';
import { Media, MediaKind } from './entity/media.entity';

type SpacesConfig = {
    host: string;
    region: string;
    accessKey: string;
    secretKey: string;
    publicBaseUrl: string;
};

@Injectable()
export class MediaService {
    constructor(
        @InjectRepository(Media)
        private readonly mediaRepo: Repository<Media>,
        private readonly configService: ConfigService,
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
        const objectKey = `companies/${companyId}/images/${contentHash}${extension}`;
        const spacesConfig = this.getSpacesConfig();

        if (spacesConfig) {
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
        const endpoint = this.readEnv('DO_SPACES_ENDPOINT');
        const region = this.readEnv('DO_SPACES_REGION');
        const bucket = this.readEnv('DO_SPACES_BUCKET');
        const accessKey = this.readEnv('DO_SPACES_KEY');
        const secretKey = this.readEnv('DO_SPACES_SECRET');
        const publicUrl = this.readEnv('DO_SPACES_CDN_URL');

        const providedCount = [endpoint, region, bucket, accessKey, secretKey].filter(Boolean).length;
        if (!providedCount) {
            return null;
        }

        if (providedCount < 5) {
            throw new InternalServerErrorException('Configuracion incompleta de DigitalOcean Spaces');
        }

        const endpointUrl = new URL((endpoint as string).startsWith('http') ? endpoint as string : `https://${endpoint}`);
        const host = endpointUrl.host.startsWith(`${bucket}.`)
            ? endpointUrl.host
            : `${bucket}.${endpointUrl.host}`;

        return {
            host,
            region: region as string,
            accessKey: accessKey as string,
            secretKey: secretKey as string,
            publicBaseUrl: this.normalizePublicBaseUrl(publicUrl) ?? `${endpointUrl.protocol}//${host}`,
        };
    }

    private async uploadToSpaces(
        buffer: Buffer,
        contentType: string | undefined,
        objectKey: string,
        config: SpacesConfig,
    ): Promise<void> {
        const method = 'PUT';
        const canonicalUri = this.toCanonicalUri(objectKey);
        const payloadHash = this.sha256Hex(buffer);
        const amzDate = this.toAmzDate(new Date());
        const dateStamp = amzDate.slice(0, 8);
        const normalizedContentType = contentType || 'application/octet-stream';

        const signedHeadersMap: Record<string, string> = {
            'content-type': normalizedContentType,
            host: config.host,
            'x-amz-acl': 'public-read',
            'x-amz-content-sha256': payloadHash,
            'x-amz-date': amzDate,
        };

        const signedHeaderNames = Object.keys(signedHeadersMap).sort();
        const canonicalHeaders = signedHeaderNames
            .map((header) => `${header}:${this.normalizeHeaderValue(signedHeadersMap[header])}\n`)
            .join('');
        const signedHeaders = signedHeaderNames.join(';');
        const canonicalRequest = [
            method,
            canonicalUri,
            '',
            canonicalHeaders,
            signedHeaders,
            payloadHash,
        ].join('\n');
        const credentialScope = `${dateStamp}/${config.region}/s3/aws4_request`;
        const stringToSign = [
            'AWS4-HMAC-SHA256',
            amzDate,
            credentialScope,
            this.sha256Hex(canonicalRequest),
        ].join('\n');
        const signingKey = this.getSignatureKey(config.secretKey, dateStamp, config.region, 's3');
        const signature = createHmac('sha256', signingKey).update(stringToSign, 'utf8').digest('hex');
        const authorization = [
            `AWS4-HMAC-SHA256 Credential=${config.accessKey}/${credentialScope}`,
            `SignedHeaders=${signedHeaders}`,
            `Signature=${signature}`,
        ].join(', ');

        await new Promise<void>((resolve, reject) => {
            const req = request(
                {
                    protocol: 'https:',
                    hostname: config.host,
                    method,
                    path: canonicalUri,
                    headers: {
                        'Content-Length': buffer.length,
                        'Content-Type': normalizedContentType,
                        Host: config.host,
                        'x-amz-acl': 'public-read',
                        'x-amz-content-sha256': payloadHash,
                        'x-amz-date': amzDate,
                        Authorization: authorization,
                    },
                },
                (res) => {
                    const chunks: Buffer[] = [];

                    res.on('data', (chunk) => {
                        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
                    });

                    res.on('end', () => {
                        const body = Buffer.concat(chunks).toString('utf8');
                        if ((res.statusCode ?? 500) >= 200 && (res.statusCode ?? 500) < 300) {
                            resolve();
                            return;
                        }

                        reject(new InternalServerErrorException(
                            `No se pudo subir la imagen a DigitalOcean Spaces (${res.statusCode ?? 500})${body ? `: ${body}` : ''}`,
                        ));
                    });
                },
            );

            req.on('error', (error) => {
                reject(new InternalServerErrorException(`Error subiendo imagen a DigitalOcean Spaces: ${error.message}`));
            });

            req.write(buffer);
            req.end();
        });
    }

    private normalizePublicBaseUrl(value?: string | null): string | null {
        if (!value) return null;
        return value.replace(/\/+$/, '');
    }

    private readEnv(key: string): string | undefined {
        const value = this.configService.get<string>(key);
        return value?.trim() ? value.trim() : undefined;
    }

    private toCanonicalUri(objectKey: string): string {
        return `/${objectKey
            .split('/')
            .map((segment) => this.encodeRfc3986(segment))
            .join('/')}`;
    }

    private encodeRfc3986(value: string): string {
        return encodeURIComponent(value).replace(/[!'()*]/g, (character) =>
            `%${character.charCodeAt(0).toString(16).toUpperCase()}`);
    }

    private normalizeHeaderValue(value: string): string {
        return value.trim().replace(/\s+/g, ' ');
    }

    private sha256Hex(value: string | Buffer): string {
        return createHash('sha256').update(value).digest('hex');
    }

    private hmacSha256(key: Buffer | string, value: string): Buffer {
        return createHmac('sha256', key).update(value, 'utf8').digest();
    }

    private getSignatureKey(secretKey: string, dateStamp: string, regionName: string, serviceName: string): Buffer {
        const kDate = this.hmacSha256(`AWS4${secretKey}`, dateStamp);
        const kRegion = this.hmacSha256(kDate, regionName);
        const kService = this.hmacSha256(kRegion, serviceName);
        return this.hmacSha256(kService, 'aws4_request');
    }

    private toAmzDate(date: Date): string {
        const isoValue = date.toISOString();
        return isoValue.replace(/[:-]|\.\d{3}/g, '');
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
