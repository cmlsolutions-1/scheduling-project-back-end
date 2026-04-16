import { MigrationInterface, QueryRunner } from "typeorm";

export class AddContentHashToMedia1775820000000 implements MigrationInterface {
    name = 'AddContentHashToMedia1775820000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "media" ADD "contentHash" character varying(64)`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_media_company_kind_hash_unique" ON "media" ("companyId", "kind", "contentHash") WHERE "contentHash" IS NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_media_company_kind_hash_unique"`);
        await queryRunner.query(`ALTER TABLE "media" DROP COLUMN "contentHash"`);
    }
}
