import { BadGatewayException, BadRequestException } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { AppointmentStatus } from './entity/appointment.entity';
import { CompanyStatus } from '../company/entity/company.entity';
import { EmployeeScheduleDay } from '../user/entity/employee-schedule.entity';
import { ServiceItemStatus } from '../service-item/entity/service-item.entity';
import { UserRole, UserStatus } from '../user/entity/user.entity';
import { Appointment } from './entity/appointment.entity';
import { AppointmentRepository } from './repositories/appointment.repository';
import { ClientRepository } from '../client/repositories/client.repository.dto';
import { Repository } from 'typeorm';
import { Client } from '../client/entity/client.entity';
import { ServiceItem } from '../service-item/entity/service-item.entity';
import { User } from '../user/entity/user.entity';
import { EmployeeService } from '../user/entity/employee-service.entity';
import { Commission } from '../billing/entity/commission.entity';
import { Company } from '../company/entity/company.entity';
import { WhatsAppService } from '../common/services/whatsapp.service';

describe('AppointmentService time zones', () => {
  const tenantId = '11111111-1111-4111-8111-111111111111';
  const employeeId = '22222222-2222-4222-8222-222222222222';
  const serviceId = '33333333-3333-4333-8333-333333333333';
  const clientId = '44444444-4444-4444-8444-444444444444';

  function buildService(
    overrides: {
      appointments?: Partial<Appointment>[];
      appointment?: Partial<Appointment>;
      whatsappSent?: boolean;
    } = {},
  ) {
    const company = {
      id: tenantId,
      name: 'Empresa Madrid',
      timeZone: 'Europe/Madrid',
      whatsappPhoneNumber: '34910000000',
      status: CompanyStatus.ACTIVE,
    };
    const serviceItem = {
      id: serviceId,
      name: 'Servicio',
      durationMinutes: 60,
      price: 100,
      commissionRate: 10,
      status: ServiceItemStatus.ACTIVE,
    };
    const employee = {
      id: employeeId,
      role: UserRole.EMPLOYEE,
      status: UserStatus.ACTIVE,
      employeeSchedules: [
        {
          dayOfWeek: EmployeeScheduleDay.MONDAY,
          startTime: '09:00',
          endTime: '12:00',
        },
      ],
    };
    const findBlockingAppointmentsForEmployeeOnDate = jest.fn(
      (...args: [string, string, Date, Date]) => {
        void args;
        return Promise.resolve((overrides.appointments ?? []) as Appointment[]);
      },
    );
    const saveAppointment = jest.fn((appointment: Appointment) =>
      Promise.resolve({
        id: '55555555-5555-4555-8555-555555555555',
        ...appointment,
        companyId: tenantId,
        serviceId,
        clientId,
      }),
    );
    const appointmentRepository = {
      findBlockingAppointmentsForEmployeeOnDate,
      findById: jest.fn().mockResolvedValue({
        id: '55555555-5555-4555-8555-555555555555',
        scheduledAt: new Date('2026-10-21T07:00:00.000Z'),
        durationMinutes: 60,
        status: AppointmentStatus.PENDING,
        company,
        client: { id: clientId, name: 'Cliente', phone: '34600000000' },
        service: serviceItem,
        employee,
        ...overrides.appointment,
      }),
      findAll: jest.fn().mockResolvedValue([]),
      save: saveAppointment,
    };
    const clientRepo = {
      findOne: jest.fn().mockResolvedValue({ id: clientId, name: 'Cliente' }),
    };
    const serviceRepo = { findOne: jest.fn().mockResolvedValue(serviceItem) };
    const userRepo = { findOne: jest.fn().mockResolvedValue(employee) };
    const employeeServiceRepo = {
      findOne: jest
        .fn()
        .mockResolvedValue({ id: 'assignment', extraCommissionRate: 0 }),
    };
    const companyRepo = { findOne: jest.fn().mockResolvedValue(company) };
    const sendMessage = jest.fn().mockResolvedValue(overrides.whatsappSent ?? true);

    const subject = new AppointmentService(
      appointmentRepository as unknown as AppointmentRepository,
      {} as ClientRepository,
      clientRepo as unknown as Repository<Client>,
      serviceRepo as unknown as Repository<ServiceItem>,
      userRepo as unknown as Repository<User>,
      employeeServiceRepo as unknown as Repository<EmployeeService>,
      {} as Repository<Commission>,
      companyRepo as unknown as Repository<Company>,
      { sendMessage } as unknown as WhatsAppService,
    );

    return {
      subject,
      findBlockingAppointmentsForEmployeeOnDate,
      findAppointmentById: appointmentRepository.findById,
      findAllAppointments: appointmentRepository.findAll,
      saveAppointment,
      sendMessage,
    };
  }

  it('creates from company-local fields and returns both local and UTC values', async () => {
    const { subject, saveAppointment } = buildService();

    const result = await subject.create(
      {
        clientId,
        serviceId,
        scheduledLocalDate: '2026-09-21',
        scheduledLocalTime: '10:00',
        timeZone: 'Europe/Madrid',
      },
      tenantId,
      'admin-id',
    );

    expect(saveAppointment.mock.calls[0][0].scheduledAt.toISOString()).toBe(
      '2026-09-21T08:00:00.000Z',
    );
    expect(result).toMatchObject({
      scheduledLocalDate: '2026-09-21',
      scheduledLocalTime: '10:00',
      timeZone: 'Europe/Madrid',
    });
    expect(result.scheduledAt.toISOString()).toBe('2026-09-21T08:00:00.000Z');
  });

  it('queries and blocks availability using the company-local day', async () => {
    const existingAppointment = {
      scheduledAt: new Date('2026-09-21T08:00:00.000Z'),
      durationMinutes: 60,
      status: AppointmentStatus.PENDING,
    };
    const { subject, findBlockingAppointmentsForEmployeeOnDate } = buildService(
      {
        appointments: [existingAppointment],
      },
    );

    const result = await subject.findPublicAvailability(
      {
        employeeId,
        serviceId,
        date: '2026-09-21',
      },
      tenantId,
    );

    const [, , from, to] =
      findBlockingAppointmentsForEmployeeOnDate.mock.calls[0];
    expect(from.toISOString()).toBe('2026-09-20T22:00:00.000Z');
    expect(to.toISOString()).toBe('2026-09-21T21:59:59.999Z');
    expect(result.timeZone).toBe('Europe/Madrid');
    expect(result.slots.find((slot) => slot.time === '10:00')).toEqual({
      time: '10:00',
      available: false,
    });
  });

  it('rejects a request time zone that differs from the company', async () => {
    const { subject } = buildService();

    await expect(
      subject.create(
        {
          clientId,
          serviceId,
          scheduledLocalDate: '2026-09-21',
          scheduledLocalTime: '10:00',
          timeZone: 'America/Bogota',
        },
        tenantId,
        'admin-id',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('resends the appointment confirmation to the client', async () => {
    const { subject, findAppointmentById, sendMessage } = buildService();

    await expect(
      subject.resendClientNotification(
        '55555555-5555-4555-8555-555555555555',
        tenantId,
      ),
    ).resolves.toEqual({
      appointmentId: '55555555-5555-4555-8555-555555555555',
      channel: 'WHATSAPP',
      sent: true,
    });

    expect(findAppointmentById).toHaveBeenCalledWith(
      '55555555-5555-4555-8555-555555555555',
      tenantId,
    );
    expect(sendMessage).toHaveBeenCalledWith({
      fromPhoneNumber: '34910000000',
      toPhoneNumber: '34600000000',
      message: expect.stringContaining('Empresa Madrid'),
    });
  });

  it('reports a WhatsApp provider failure when resending', async () => {
    const { subject } = buildService({ whatsappSent: false });

    await expect(
      subject.resendClientNotification(
        '55555555-5555-4555-8555-555555555555',
        tenantId,
      ),
    ).rejects.toBeInstanceOf(BadGatewayException);
  });

  it('resolves date-only list filters in the company time zone', async () => {
    const { subject, findAllAppointments } = buildService();

    await subject.findAll(tenantId, {
      from: '2026-10-21',
      to: '2026-10-21',
    });

    const filters = findAllAppointments.mock.calls[0][1];
    expect(filters.from.toISOString()).toBe('2026-10-20T22:00:00.000Z');
    expect(filters.to.toISOString()).toBe('2026-10-21T21:59:59.999Z');
  });
});
