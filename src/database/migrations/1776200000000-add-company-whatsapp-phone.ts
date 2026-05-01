import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCompanyWhatsappPhone1776200000000 implements MigrationInterface {
    name = 'AddCompanyWhatsappPhone1776200000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "company" ADD "whatsappPhoneNumber" character varying(30)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "company" DROP COLUMN "whatsappPhoneNumber"`);
    }
}
