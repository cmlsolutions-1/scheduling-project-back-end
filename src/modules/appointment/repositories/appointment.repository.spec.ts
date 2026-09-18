import { FindManyOptions, FindOperator, Repository } from 'typeorm';
import { Appointment } from '../entity/appointment.entity';
import { AppointmentRepository } from './appointment.repository';

describe('AppointmentRepository date filters', () => {
  const tenantId = '11111111-1111-4111-8111-111111111111';

  function buildRepository() {
    const find = jest.fn(
      (options: FindManyOptions<Appointment>): Promise<Appointment[]> => {
        void options;
        return Promise.resolve([]);
      },
    );
    const subject = new AppointmentRepository({
      find,
    } as unknown as Repository<Appointment>);
    return { subject, find };
  }

  it('applies a from filter independently', async () => {
    const { subject, find } = buildRepository();
    const from = new Date('2026-10-01T00:00:00.000Z');

    await subject.findAll(tenantId, { from });

    const operator = find.mock.calls[0][0].where
      .scheduledAt as FindOperator<Date>;
    expect(operator.type).toBe('moreThanOrEqual');
    expect(operator.value).toBe(from);
  });

  it('applies a to filter independently', async () => {
    const { subject, find } = buildRepository();
    const to = new Date('2026-10-31T23:59:59.999Z');

    await subject.findAll(tenantId, { to });

    const operator = find.mock.calls[0][0].where
      .scheduledAt as FindOperator<Date>;
    expect(operator.type).toBe('lessThanOrEqual');
    expect(operator.value).toBe(to);
  });
});
