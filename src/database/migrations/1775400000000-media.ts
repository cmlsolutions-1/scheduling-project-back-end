import { MigrationInterface, QueryRunner } from "typeorm";

export class Media1775400000000 implements MigrationInterface {
    name = 'Media1775400000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."media_kind_enum" AS ENUM('IMAGE')`);
        await queryRunner.query(`CREATE TABLE "media" ("CreatedAt" TIMESTAMP NOT NULL DEFAULT now(), "UpdateAt" TIMESTAMP NOT NULL DEFAULT now(), "createdBy" character varying, "updatedBy" character varying, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "kind" "public"."media_kind_enum" NOT NULL DEFAULT 'IMAGE', "originalName" character varying NOT NULL, "fileName" character varying NOT NULL, "mimeType" character varying NOT NULL, "size" integer NOT NULL, "url" character varying NOT NULL, "companyId" uuid NOT NULL, CONSTRAINT "PK_28588cda11106f2571361e4fbe5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "media" ADD CONSTRAINT "FK_90b0f6ce10a5283c1f5b631111a" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "media" DROP CONSTRAINT "FK_90b0f6ce10a5283c1f5b631111a"`);
        await queryRunner.query(`DROP TABLE "media"`);
        await queryRunner.query(`DROP TYPE "public"."media_kind_enum"`);
    }
}
