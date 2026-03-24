import { AuditEntity } from "src/modules/common/entities/audit.entity";
import { Session } from "src/modules/session/entity/session.entity";
import { Company } from "src/modules/company/entity/company.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, RelationId } from "typeorm";


export enum UserStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
}

export enum UserRole {
    SUPER_ADMIN = 'SUPER_ADMIN',
    ADMIN = 'ADMIN',
    EMPLOYEE = 'EMPLOYEE',
}


@Entity('user')
export class User extends AuditEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column()
    email: string;

    @Column()
    phone: string;

    @Column()
    password: string;

    @Column({
        type: 'enum',
        enum: UserStatus,
        default: UserStatus.ACTIVE,
    })
    status: UserStatus;

    @Column({
        type: 'enum',
        enum: UserRole
    })
    role: UserRole;

    @ManyToOne(() => Company, (company) => company.users, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'companyId' })
    company?: Company;

    @RelationId((user: User) => user.company)
    companyId?: string;

    @OneToMany(() => Session, session => session.user)
    sessions: Session[];
}
