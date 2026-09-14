import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCompanyTimeZone1777300000000 implements MigrationInterface {
  name = 'AddCompanyTimeZone1777300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "company" ADD "timeZone" character varying(100) NOT NULL DEFAULT 'America/Bogota'`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointment" ALTER COLUMN "scheduledAt" TYPE TIMESTAMP WITH TIME ZONE USING "scheduledAt" AT TIME ZONE 'UTC'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "appointment" ALTER COLUMN "scheduledAt" TYPE TIMESTAMP WITHOUT TIME ZONE USING "scheduledAt" AT TIME ZONE 'UTC'`,
    );
    await queryRunner.query(`ALTER TABLE "company" DROP COLUMN "timeZone"`);
  }
}
