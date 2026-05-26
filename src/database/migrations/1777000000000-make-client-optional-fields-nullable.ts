import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeClientOptionalFieldsNullable1777000000000 implements MigrationInterface {
    name = 'MakeClientOptionalFieldsNullable1777000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "client" ALTER COLUMN "documentType" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "client" ALTER COLUMN "documentNumber" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "client" ALTER COLUMN "address" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "client" ALTER COLUMN "birthDate" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE FROM "client" WHERE "documentType" IS NULL OR "documentNumber" IS NULL OR "address" IS NULL OR "birthDate" IS NULL`);
        await queryRunner.query(`ALTER TABLE "client" ALTER COLUMN "birthDate" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "client" ALTER COLUMN "address" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "client" ALTER COLUMN "documentNumber" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "client" ALTER COLUMN "documentType" SET NOT NULL`);
    }
}
