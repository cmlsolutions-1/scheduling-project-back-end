import { MigrationInterface, QueryRunner } from "typeorm";

export class AddExtraCommissionRateToEmployeeService1777200000000 implements MigrationInterface {
    name = 'AddExtraCommissionRateToEmployeeService1777200000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "employee_service" ADD "extraCommissionRate" numeric(5,2) NOT NULL DEFAULT '0'`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "employee_service" DROP COLUMN "extraCommissionRate"`);
    }
}
