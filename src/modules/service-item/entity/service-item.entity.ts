import { AuditEntity } from "src/modules/common/entities/audit.entity";
import { Company } from "src/modules/company/entity/company.entity";
import { Appointment } from "src/modules/appointment/entity/appointment.entity";
import { EmployeeService } from "src/modules/user/entity/employee-service.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, RelationId } from "typeorm";

export enum ServiceItemStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
}

@Entity('service_item')
export class ServiceItem extends AuditEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 120 })
    name: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column('numeric', { precision: 12, scale: 2 })
    price: number;

    @Column('numeric', { precision: 5, scale: 2, default: 0 })
    commissionRate: number;

    @Column({
        type: 'enum',
        enum: ServiceItemStatus,
        default: ServiceItemStatus.ACTIVE,
    })
    status: ServiceItemStatus;

    @ManyToOne(() => Company, (company) => company.services, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'companyId' })
    company: Company;

    @RelationId((service: ServiceItem) => service.company)
    companyId: string;

    @OneToMany(() => Appointment, (appointment) => appointment.service)
    appointments: Appointment[];

    @OneToMany(() => EmployeeService, (employeeService) => employeeService.service)
    employeeServices: EmployeeService[];
}
