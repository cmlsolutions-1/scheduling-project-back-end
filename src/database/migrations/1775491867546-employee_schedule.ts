import { MigrationInterface, QueryRunner } from "typeorm";

export class EmployeeSchedule1775491867546 implements MigrationInterface {
    name = 'EmployeeSchedule1775491867546'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."employee_schedule_dayofweek_enum" AS ENUM('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY')`);
        await queryRunner.query(`CREATE TABLE "employee_schedule" ("CreatedAt" TIMESTAMP NOT NULL DEFAULT now(), "UpdateAt" TIMESTAMP NOT NULL DEFAULT now(), "createdBy" character varying, "updatedBy" character varying, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "dayOfWeek" "public"."employee_schedule_dayofweek_enum" NOT NULL, "startTime" character varying(5) NOT NULL, "endTime" character varying(5) NOT NULL, "employeeId" uuid NOT NULL, CONSTRAINT "UQ_employee_schedule_employee_day_start_end" UNIQUE ("employeeId", "dayOfWeek", "startTime", "endTime"), CONSTRAINT "PK_6d849e34b04c104b4c76b92fccf" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "employee_schedule" ADD CONSTRAINT "FK_00fda0dea152ca01567aa51a151" FOREIGN KEY ("employeeId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "employee_schedule" DROP CONSTRAINT "FK_00fda0dea152ca01567aa51a151"`);
        await queryRunner.query(`DROP TABLE "employee_schedule"`);
        await queryRunner.query(`DROP TYPE "public"."employee_schedule_dayofweek_enum"`);
    }

}
