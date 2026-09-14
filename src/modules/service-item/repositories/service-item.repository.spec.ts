import { Repository } from 'typeorm';
import { MediaService } from '../../media/media.service';
import { ServiceItem, ServiceItemStatus } from '../entity/service-item.entity';
import { ServiceItemRepository } from './service-item.repository';

describe('ServiceItemRepository listings', () => {
  const tenantId = '11111111-1111-4111-8111-111111111111';

  function buildRepository() {
    const find = jest.fn().mockResolvedValue([]);
    const typeOrmRepository = { find } as unknown as Repository<ServiceItem>;
    const subject = new ServiceItemRepository(
      typeOrmRepository,
      {} as MediaService,
    );
    return { subject, find };
  }

  it('returns active and inactive services for the administrative listing', async () => {
    const { subject, find } = buildRepository();

    await subject.findAll(tenantId);

    expect(find).toHaveBeenCalledWith({
      where: { company: { id: tenantId } },
      relations: ['image'],
    });
  });

  it('keeps the public listing limited to active services', async () => {
    const { subject, find } = buildRepository();

    await subject.findAllActive(tenantId);

    expect(find).toHaveBeenCalledWith({
      where: {
        company: { id: tenantId },
        status: ServiceItemStatus.ACTIVE,
      },
      relations: ['image'],
    });
  });
});
