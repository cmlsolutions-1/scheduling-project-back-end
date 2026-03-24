import { AuditEntity } from "src/modules/common/entities/audit.entity";
import { Company } from "src/modules/company/entity/company.entity";
import { User } from "src/modules/user/entity/user.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, RelationId } from "typeorm";
import { Commission } from "./commission.entity";

export enum LiquidationStatus {
    PENDING = 'PENDING',
    PAID = 'PAID',
}

@Entity('liquidation')
export class Liquidation extends AuditEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'timestamp' })
    periodStart: Date;

    @Column({ type: 'timestamp' })
    periodEnd: Date;

    @Column('numeric', { precision: 12, scale: 2 })
    totalAmount: number;

    @Column({ type: 'int', default: 0 })
    commissionCount: number;

    @Column({
        type: 'enum',
        enum: LiquidationStatus,
        default: LiquidationStatus.PAID,
    })
    status: LiquidationStatus;

    @Column({ type: 'timestamp', nullable: true })
    paidAt?: Date;

    @ManyToOne(() => Company, (company) => company.liquidations, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'companyId' })
    company: Company;

    @RelationId((liquidation: Liquidation) => liquidation.company)
    companyId: string;

    @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'employeeId' })
    employee: User;

    @RelationId((liquidation: Liquidation) => liquidation.employee)
    employeeId: string;

    @OneToMany(() => Commission, (commission) => commission.liquidation)
    commissions: Commission[];
}
