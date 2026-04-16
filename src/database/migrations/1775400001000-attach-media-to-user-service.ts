import { MigrationInterface, QueryRunner } from "typeorm";

export class AttachMediaToUserService1775400001000 implements MigrationInterface {
    name = 'AttachMediaToUserService1775400001000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD "imageId" uuid`);
        await queryRunner.query(`ALTER TABLE "service_item" ADD "imageId" uuid`);
        await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "FK_87c78794739a9745e345bb41e69" FOREIGN KEY ("imageId") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "service_item" ADD CONSTRAINT "FK_2f43f24f7f89062f1ecbfb2a7da" FOREIGN KEY ("imageId") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "service_item" DROP CONSTRAINT "FK_2f43f24f7f89062f1ecbfb2a7da"`);
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "FK_87c78794739a9745e345bb41e69"`);
        await queryRunner.query(`ALTER TABLE "service_item" DROP COLUMN "imageId"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "imageId"`);
    }
}
