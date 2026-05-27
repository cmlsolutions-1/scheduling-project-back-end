import { AuditEntity } from "src/modules/common/entities/audit.entity";
import { Company } from "src/modules/company/entity/company.entity";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, RelationId } from "typeorm";



export enum ClientStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
}

export enum DocumentType {
    CC = 'CC',
    TI = 'TI',
    CE = 'CE',
    PASSPORT = 'PASSPORT',
}


@Entity('client')
export class Client extends AuditEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    name!: string;

    @Column()
    email!: string;

    @Column()
    phone!: string;

    @Column({
        type: 'enum',
        enum: ClientStatus,
        default: ClientStatus.ACTIVE,
    })
    status!: ClientStatus;

    @Column({
        type: 'enum',
        enum: DocumentType,
        nullable: true,
    })
    documentType?: DocumentType;

    @Column({ type: 'varchar', nullable: true })
    documentNumber?: string;

    @Column({ type: 'varchar', nullable: true })
    address?: string;

    @Column({ type: 'timestamp', nullable: true })
    birthDate?: Date;

    @ManyToOne(() => Company, (company) => company.clients, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'companyId' })
    company!: Company;

    @RelationId((client: Client) => client.company)
    companyId!: string;

}
