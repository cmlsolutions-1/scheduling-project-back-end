import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { S3Client } from '@aws-sdk/client-s3';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { Media } from './entity/media.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Media])],
  controllers: [MediaController],
  providers: [
    {
      provide: 'S3_CLIENT',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const readEnv = (...keys: string[]) => {
          for (const key of keys) {
            const value = configService.get<string>(key)?.trim();
            if (value) return value;
          }

          return undefined;
        };

        const bucket = readEnv('SPACES_BUCKET', 'DO_SPACES_BUCKET');
        const cdnUrl = readEnv('SPACES_URL_CDN', 'DO_SPACES_CDN_URL', 'SPACES_CDN_URL');
        const accessKeyId = readEnv('SPACES_KEY', 'DO_SPACES_KEY', 'SPACES_ACCESS_KEY', 'SPACES_ACCESS_KEY_ID');
        const secretAccessKey = readEnv('SPACES_SECRET', 'DO_SPACES_SECRET', 'SPACES_SECRET_KEY', 'SPACES_SECRET_ACCESS_KEY');

        if (!bucket || !cdnUrl || !accessKeyId || !secretAccessKey) {
          return null;
        }

        const endpoint = buildSpacesEndpointFromCdn(cdnUrl, bucket);
        if (!endpoint) {
          return null;
        }

        return new S3Client({
          region: 'us-east-1',
          endpoint,
          credentials: {
            accessKeyId,
            secretAccessKey,
          },
        });
      },
    },
    MediaService,
  ],
  exports: [TypeOrmModule, MediaService],
})
export class MediaModule {}

function buildSpacesEndpointFromCdn(cdnUrl: string, bucket: string): string | null {
  const parsedUrl = new URL(cdnUrl.startsWith('http') ? cdnUrl : `https://${cdnUrl}`);
  const normalizedHost = normalizeSpacesApiHost(parsedUrl.host, bucket);

  if (!normalizedHost.endsWith('.digitaloceanspaces.com')) {
    return null;
  }

  return `${parsedUrl.protocol}//${normalizedHost}`;
}

function normalizeSpacesApiHost(host: string, bucket: string): string {
  const hostWithoutBucket = host.startsWith(`${bucket}.`)
    ? host.slice(bucket.length + 1)
    : host;

  return hostWithoutBucket.replace('.cdn.digitaloceanspaces.com', '.digitaloceanspaces.com');
}
