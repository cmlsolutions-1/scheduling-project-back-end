import { MigrationInterface, QueryRunner } from "typeorm";

export class Entities1774389354409 implements MigrationInterface {
    name = 'Entities1774389354409'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."liquidation_status_enum" AS ENUM('PENDING', 'PAID')`);
        await queryRunner.query(`CREATE TABLE "liquidation" ("CreatedAt" TIMESTAMP NOT NULL DEFAULT now(), "UpdateAt" TIMESTAMP NOT NULL DEFAULT now(), "createdBy" character varying, "updatedBy" character varying, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "periodStart" TIMESTAMP NOT NULL, "periodEnd" TIMESTAMP NOT NULL, "totalAmount" numeric(12,2) NOT NULL, "commissionCount" integer NOT NULL DEFAULT '0', "status" "public"."liquidation_status_enum" NOT NULL DEFAULT 'PAID', "paidAt" TIMESTAMP, "companyId" uuid NOT NULL, "employeeId" uuid NOT NULL, CONSTRAINT "PK_5dbd42b2874762f096557112e0c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."commission_status_enum" AS ENUM('PENDING', 'LIQUIDATED')`);
        await queryRunner.query(`CREATE TABLE "commission" ("CreatedAt" TIMESTAMP NOT NULL DEFAULT now(), "UpdateAt" TIMESTAMP NOT NULL DEFAULT now(), "createdBy" character varying, "updatedBy" character varying, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "amount" numeric(12,2) NOT NULL, "status" "public"."commission_status_enum" NOT NULL DEFAULT 'PENDING', "companyId" uuid NOT NULL, "employeeId" uuid NOT NULL, "appointmentId" uuid NOT NULL, "liquidationId" uuid, CONSTRAINT "REL_87fcad1a835a29d3139d0fab4b" UNIQUE ("appointmentId"), CONSTRAINT "PK_d108d70411783e2a3a84e386601" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."appointment_status_enum" AS ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')`);
        await queryRunner.query(`CREATE TABLE "appointment" ("CreatedAt" TIMESTAMP NOT NULL DEFAULT now(), "UpdateAt" TIMESTAMP NOT NULL DEFAULT now(), "createdBy" character varying, "updatedBy" character varying, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "scheduledAt" TIMESTAMP NOT NULL, "durationMinutes" integer, "notes" text, "status" "public"."appointment_status_enum" NOT NULL DEFAULT 'PENDING', "servicePrice" numeric(12,2) NOT NULL, "commissionRate" numeric(5,2) NOT NULL DEFAULT '0', "completedAt" TIMESTAMP, "companyId" uuid NOT NULL, "employeeId" uuid, "clientId" uuid NOT NULL, "serviceId" uuid NOT NULL, CONSTRAINT "PK_e8be1a53027415e709ce8a2db74" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."service_item_status_enum" AS ENUM('ACTIVE', 'INACTIVE')`);
        await queryRunner.query(`CREATE TABLE "service_item" ("CreatedAt" TIMESTAMP NOT NULL DEFAULT now(), "UpdateAt" TIMESTAMP NOT NULL DEFAULT now(), "createdBy" character varying, "updatedBy" character varying, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(120) NOT NULL, "description" text, "price" numeric(12,2) NOT NULL, "commissionRate" numeric(5,2) NOT NULL DEFAULT '0', "status" "public"."service_item_status_enum" NOT NULL DEFAULT 'ACTIVE', "companyId" uuid NOT NULL, CONSTRAINT "PK_4b061659545d9cc5d7c1f4805fc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."company_status_enum" AS ENUM('ACTIVE', 'INACTIVE')`);
        await queryRunner.query(`CREATE TABLE "company" ("CreatedAt" TIMESTAMP NOT NULL DEFAULT now(), "UpdateAt" TIMESTAMP NOT NULL DEFAULT now(), "createdBy" character varying, "updatedBy" character varying, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "description" text, "frontendDomain" character varying(200) NOT NULL, "status" "public"."company_status_enum" NOT NULL DEFAULT 'ACTIVE', CONSTRAINT "UQ_94a82a49fcc3a9e871382fe8ddd" UNIQUE ("frontendDomain"), CONSTRAINT "PK_056f7854a7afdba7cbd6d45fc20" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "user" ADD "companyId" uuid`);
        await queryRunner.query(`ALTER TABLE "client" ADD "companyId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "FK_86586021a26d1180b0968f98502" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "client" ADD CONSTRAINT "FK_3d7a0b6e0f1d0c0ab1bc189645f" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "liquidation" ADD CONSTRAINT "FK_ff9fda0a5087df0510110006c83" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "liquidation" ADD CONSTRAINT "FK_aa66c7ff01e7d9602a792d13a99" FOREIGN KEY ("employeeId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "commission" ADD CONSTRAINT "FK_1f921906f5f53ef396e5458686c" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "commission" ADD CONSTRAINT "FK_0c9693b3e77f907e0ed0c771f8d" FOREIGN KEY ("employeeId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "commission" ADD CONSTRAINT "FK_87fcad1a835a29d3139d0fab4bc" FOREIGN KEY ("appointmentId") REFERENCES "appointment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "commission" ADD CONSTRAINT "FK_c1e0b2d5fd2abdc49997a2330ab" FOREIGN KEY ("liquidationId") REFERENCES "liquidation"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "appointment" ADD CONSTRAINT "FK_887d0cd9b48866fd1e269968f55" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "appointment" ADD CONSTRAINT "FK_b6e57758a28acd843878b1f30d8" FOREIGN KEY ("employeeId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "appointment" ADD CONSTRAINT "FK_60ac979e3cb15127f2221e3b66d" FOREIGN KEY ("clientId") REFERENCES "client"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "appointment" ADD CONSTRAINT "FK_cee8b55c31f700609674da96b0b" FOREIGN KEY ("serviceId") REFERENCES "service_item"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "service_item" ADD CONSTRAINT "FK_56bb38d034691cdd029bfb464f8" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "service_item" DROP CONSTRAINT "FK_56bb38d034691cdd029bfb464f8"`);
        await queryRunner.query(`ALTER TABLE "appointment" DROP CONSTRAINT "FK_cee8b55c31f700609674da96b0b"`);
        await queryRunner.query(`ALTER TABLE "appointment" DROP CONSTRAINT "FK_60ac979e3cb15127f2221e3b66d"`);
        await queryRunner.query(`ALTER TABLE "appointment" DROP CONSTRAINT "FK_b6e57758a28acd843878b1f30d8"`);
        await queryRunner.query(`ALTER TABLE "appointment" DROP CONSTRAINT "FK_887d0cd9b48866fd1e269968f55"`);
        await queryRunner.query(`ALTER TABLE "commission" DROP CONSTRAINT "FK_c1e0b2d5fd2abdc49997a2330ab"`);
        await queryRunner.query(`ALTER TABLE "commission" DROP CONSTRAINT "FK_87fcad1a835a29d3139d0fab4bc"`);
        await queryRunner.query(`ALTER TABLE "commission" DROP CONSTRAINT "FK_0c9693b3e77f907e0ed0c771f8d"`);
        await queryRunner.query(`ALTER TABLE "commission" DROP CONSTRAINT "FK_1f921906f5f53ef396e5458686c"`);
        await queryRunner.query(`ALTER TABLE "liquidation" DROP CONSTRAINT "FK_aa66c7ff01e7d9602a792d13a99"`);
        await queryRunner.query(`ALTER TABLE "liquidation" DROP CONSTRAINT "FK_ff9fda0a5087df0510110006c83"`);
        await queryRunner.query(`ALTER TABLE "client" DROP CONSTRAINT "FK_3d7a0b6e0f1d0c0ab1bc189645f"`);
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "FK_86586021a26d1180b0968f98502"`);
        await queryRunner.query(`ALTER TABLE "client" DROP COLUMN "companyId"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "companyId"`);
        await queryRunner.query(`DROP TABLE "company"`);
        await queryRunner.query(`DROP TYPE "public"."company_status_enum"`);
        await queryRunner.query(`DROP TABLE "service_item"`);
        await queryRunner.query(`DROP TYPE "public"."service_item_status_enum"`);
        await queryRunner.query(`DROP TABLE "appointment"`);
        await queryRunner.query(`DROP TYPE "public"."appointment_status_enum"`);
        await queryRunner.query(`DROP TABLE "commission"`);
        await queryRunner.query(`DROP TYPE "public"."commission_status_enum"`);
        await queryRunner.query(`DROP TABLE "liquidation"`);
        await queryRunner.query(`DROP TYPE "public"."liquidation_status_enum"`);
    }

}
