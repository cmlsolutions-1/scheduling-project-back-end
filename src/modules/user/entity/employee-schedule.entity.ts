import { AuditEntity } from "src/modules/common/entities/audit.entity";
import { Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, RelationId, Column, Unique } from "typeorm";
import { User } from "./user.entity";

export enum EmployeeScheduleDay {
    MONDAY = 'MONDAY',
    TUESDAY = 'TUESDAY',
    WEDNESDAY = 'WEDNESDAY',
    THURSDAY = 'THURSDAY',
    FRIDAY = 'FRIDAY',
    SATURDAY = 'SATURDAY',
    SUNDAY = 'SUNDAY',
}

@Entity('employee_schedule')
@Unique('UQ_employee_schedule_employee_day_start_end', ['employee', 'dayOfWeek', 'startTime', 'endTime'])
export class EmployeeSchedule extends AuditEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        type: 'enum',
        enum: EmployeeScheduleDay,
    })
    dayOfWeek: EmployeeScheduleDay;

    @Column({ length: 5 })
    startTime: string;

    @Column({ length: 5 })
    endTime: string;

    @ManyToOne(() => User, (user) => user.employeeSchedules, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'employeeId' })
    employee: User;

    @RelationId((employeeSchedule: EmployeeSchedule) => employeeSchedule.employee)
    employeeId: string;
}
