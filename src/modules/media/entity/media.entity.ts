import { AuditEntity } from "src/modules/common/entities/audit.entity";
import { Company } from "src/modules/company/entity/company.entity";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, RelationId } from "typeorm";

export enum MediaKind {
    IMAGE = 'IMAGE',
}

@Entity('media')
export class Media extends AuditEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        type: 'enum',
        enum: MediaKind,
        default: MediaKind.IMAGE,
    })
    kind: MediaKind;

    @Column()
    originalName: string;

    @Column()
    fileName: string;

    @Column()
    mimeType: string;

    @Column({ type: 'int' })
    size: number;

    @Column()
    url: string;

    @Column({ length: 64, nullable: true })
    contentHash?: string;

    @ManyToOne(() => Company, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'companyId' })
    company: Company;

    @RelationId((media: Media) => media.company)
    companyId: string;
}
