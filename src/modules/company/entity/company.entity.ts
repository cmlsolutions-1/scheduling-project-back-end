import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { AuditEntity } from "src/modules/common/entities/audit.entity";
import { User } from "src/modules/user/entity/user.entity";
import { Client } from "src/modules/client/entity/client.entity";
import { ServiceItem } from "src/modules/service-item/entity/service-item.entity";
import { Appointment } from "src/modules/appointment/entity/appointment.entity";
import { Commission } from "src/modules/billing/entity/commission.entity";
import { Liquidation } from "src/modules/billing/entity/liquidation.entity";

export enum CompanyStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
}

@Entity('company')
export class Company extends AuditEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 100 })
    name: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ length: 200, unique: true })
    frontendDomain: string;

    @Column({
        type: 'enum',
        enum: CompanyStatus,
        default: CompanyStatus.ACTIVE,
    })
    status: CompanyStatus;

    @OneToMany(() => User, (user) => user.company)
    users: User[];

    @OneToMany(() => Client, (client) => client.company)
    clients: Client[];

    @OneToMany(() => ServiceItem, (service) => service.company)
    services: ServiceItem[];

    @OneToMany(() => Appointment, (appointment) => appointment.company)
    appointments: Appointment[];

    @OneToMany(() => Commission, (commission) => commission.company)
    commissions: Commission[];

    @OneToMany(() => Liquidation, (liquidation) => liquidation.company)
    liquidations: Liquidation[];
}
