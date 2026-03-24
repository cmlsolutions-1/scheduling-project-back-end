import { AuditEntity } from "src/modules/common/entities/audit.entity";
import { Company } from "src/modules/company/entity/company.entity";
import { Client } from "src/modules/client/entity/client.entity";
import { User } from "src/modules/user/entity/user.entity";
import { ServiceItem } from "src/modules/service-item/entity/service-item.entity";
import { Commission } from "src/modules/billing/entity/commission.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn, RelationId } from "typeorm";

export enum AppointmentStatus {
    PENDING = 'PENDING',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
}

@Entity('appointment')
export class Appointment extends AuditEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'timestamp' })
    scheduledAt: Date;

    @Column({ type: 'int', nullable: true })
    durationMinutes?: number;

    @Column({ type: 'text', nullable: true })
    notes?: string;

    @Column({
        type: 'enum',
        enum: AppointmentStatus,
        default: AppointmentStatus.PENDING,
    })
    status: AppointmentStatus;

    @Column('numeric', { precision: 12, scale: 2 })
    servicePrice: number;

    @Column('numeric', { precision: 5, scale: 2, default: 0 })
    commissionRate: number;

    @Column({ type: 'timestamp', nullable: true })
    completedAt?: Date;

    @ManyToOne(() => Company, (company) => company.appointments, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'companyId' })
    company: Company;

    @RelationId((appointment: Appointment) => appointment.company)
    companyId: string;

    @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'employeeId' })
    employee?: User;

    @RelationId((appointment: Appointment) => appointment.employee)
    employeeId?: string;

    @ManyToOne(() => Client, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'clientId' })
    client: Client;

    @RelationId((appointment: Appointment) => appointment.client)
    clientId: string;

    @ManyToOne(() => ServiceItem, (service) => service.appointments, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'serviceId' })
    service: ServiceItem;

    @RelationId((appointment: Appointment) => appointment.service)
    serviceId: string;

    @OneToOne(() => Commission, (commission) => commission.appointment)
    commission?: Commission;
}
