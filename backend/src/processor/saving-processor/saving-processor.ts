import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { SavingPointService } from 'src/modules/saving-point/core/app/saving-point.service.js';

@Processor('saving')
export class SavingProcessor extends WorkerHost {
  constructor(private readonly savingPointService: SavingPointService) {
    super();
  }

  async process(job: Job): Promise<void> {
    if (job.name === 'calculate') {
      const budgetId = job.data.budgetId;
      const userId = job.data.userId;
      const startDate = job.data.startDate;
      const endDate = job.data.endDate;
      await this.savingPointService.savingMonthly(
        userId,
        budgetId,
        startDate,
        endDate,
      );
    }
  }
}
