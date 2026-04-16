import { MigrationInterface, QueryRunner } from "typeorm";

export class DurationInMinutes1774578716223 implements MigrationInterface {
    name = 'DurationInMinutes1774578716223'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "service_item" ADD "durationMinutes" integer NOT NULL DEFAULT '60'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "service_item" DROP COLUMN "durationMinutes"`);
    }

}
