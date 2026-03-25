import { AuditEntity } from "src/modules/common/entities/audit.entity";
import { ServiceItem } from "src/modules/service-item/entity/service-item.entity";
import { User } from "./user.entity";
import { Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";

@Entity('employee_service')
@Unique('UQ_employee_service_employee_service', ['employee', 'service'])
export class EmployeeService extends AuditEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, (user) => user.employeeServices, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'employeeId' })
    employee: User;

    @ManyToOne(() => ServiceItem, (service) => service.employeeServices, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'serviceId' })
    service: ServiceItem;
}
