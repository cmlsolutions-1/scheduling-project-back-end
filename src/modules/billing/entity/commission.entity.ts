import { AuditEntity } from "src/modules/common/entities/audit.entity";
import { Company } from "src/modules/company/entity/company.entity";
import { Appointment } from "src/modules/appointment/entity/appointment.entity";
import { User } from "src/modules/user/entity/user.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn, RelationId } from "typeorm";
import { Liquidation } from "./liquidation.entity";

export enum CommissionStatus {
    PENDING = 'PENDING',
    LIQUIDATED = 'LIQUIDATED',
}

@Entity('commission')
export class Commission extends AuditEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('numeric', { precision: 12, scale: 2 })
    amount: number;

    @Column({
        type: 'enum',
        enum: CommissionStatus,
        default: CommissionStatus.PENDING,
    })
    status: CommissionStatus;

    @ManyToOne(() => Company, (company) => company.commissions, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'companyId' })
    company: Company;

    @RelationId((commission: Commission) => commission.company)
    companyId: string;

    @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'employeeId' })
    employee: User;

    @RelationId((commission: Commission) => commission.employee)
    employeeId: string;

    @OneToOne(() => Appointment, (appointment) => appointment.commission, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'appointmentId' })
    appointment: Appointment;

    @RelationId((commission: Commission) => commission.appointment)
    appointmentId: string;

    @ManyToOne(() => Liquidation, (liquidation) => liquidation.commissions, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'liquidationId' })
    liquidation?: Liquidation;

    @RelationId((commission: Commission) => commission.liquidation)
    liquidationId?: string;
}
