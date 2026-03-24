import { Column, CreateDateColumn, UpdateDateColumn } from "typeorm";




export abstract class AuditEntity {

    @CreateDateColumn()
    CreatedAt: Date;

    @UpdateDateColumn()
    UpdateAt: Date;

    @Column({ nullable: true })
    createdBy: string;

    @Column({ nullable: true })
    updatedBy: string;
}