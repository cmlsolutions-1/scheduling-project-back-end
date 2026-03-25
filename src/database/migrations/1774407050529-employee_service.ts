import { MigrationInterface, QueryRunner } from "typeorm";

export class EmployeeService1774407050529 implements MigrationInterface {
    name = 'EmployeeService1774407050529'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "employee_service" ("CreatedAt" TIMESTAMP NOT NULL DEFAULT now(), "UpdateAt" TIMESTAMP NOT NULL DEFAULT now(), "createdBy" character varying, "updatedBy" character varying, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "employeeId" uuid NOT NULL, "serviceId" uuid NOT NULL, CONSTRAINT "UQ_employee_service_employee_service" UNIQUE ("employeeId", "serviceId"), CONSTRAINT "PK_8db86c8ab59ff12ba736b7b3e03" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "employee_service" ADD CONSTRAINT "FK_ac0df0a5a2f486284105107a950" FOREIGN KEY ("employeeId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "employee_service" ADD CONSTRAINT "FK_90caf97a6f9bf688098d561ad28" FOREIGN KEY ("serviceId") REFERENCES "service_item"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "employee_service" DROP CONSTRAINT "FK_90caf97a6f9bf688098d561ad28"`);
        await queryRunner.query(`ALTER TABLE "employee_service" DROP CONSTRAINT "FK_ac0df0a5a2f486284105107a950"`);
        await queryRunner.query(`DROP TABLE "employee_service"`);
    }

}
