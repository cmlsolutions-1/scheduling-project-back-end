import { AuditEntity } from "src/modules/common/entities/audit.entity";
import { User } from "src/modules/user/entity/user.entity";
import { Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('session')
export class Session extends AuditEntity {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, user => user.sessions, {
        onDelete: 'CASCADE',
    })
    user: User;

    @Index()
    @Column({ type: 'text', nullable: true })
    refreshTokenHash: string | null;

    @Column({ type: 'timestamp', nullable: true })
    refreshTokenExpiresAt: Date | null;

    @Column({ default: true })
    isActive: boolean;

    @Column({ nullable: true })
    ipAddress?: string;

    @Column({ nullable: true })
    userAgent?: string;

    @Column({ nullable: true })
    lastRefreshAt?: Date;
}