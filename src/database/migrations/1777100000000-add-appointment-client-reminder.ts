import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAppointmentClientReminder1777100000000 implements MigrationInterface {
    name = 'AddAppointmentClientReminder1777100000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "appointment" ADD "clientReminderSentAt" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "appointment" DROP COLUMN "clientReminderSentAt"`);
    }
}
