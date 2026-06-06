import { SavingProcessor } from './saving-processor.js';
import type { SavingPointService } from '../../modules/saving-point/core/app/saving-point.service.js';

describe('SavingProcessor', () => {
  it('should be defined', () => {
    const processor = new SavingProcessor({} as unknown as SavingPointService);
    expect(processor).toBeDefined();
  });
});
