import { AuditEntity } from "src/modules/common/entities/audit.entity";
import { ServiceItem } from "src/modules/service-item/entity/service-item.entity";
import { User } from "./user.entity";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, RelationId, Unique } from "typeorm";

@Entity('employee_service')
@Unique('UQ_employee_service_employee_service', ['employee', 'service'])
export class EmployeeService extends AuditEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column('numeric', { precision: 5, scale: 2, default: 0 })
    extraCommissionRate!: number;

    @ManyToOne(() => User, (user) => user.employeeServices, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'employeeId' })
    employee!: User;

    @RelationId((employeeService: EmployeeService) => employeeService.employee)
    employeeId!: string;

    @ManyToOne(() => ServiceItem, (service) => service.employeeServices, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'serviceId' })
    service!: ServiceItem;

    @RelationId((employeeService: EmployeeService) => employeeService.service)
    serviceId!: string;
}
