import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RecurringTransactionService } from './recurring-transaction.service.js';

@Injectable()
export class RecurringTransactionCron {
  private readonly logger = new Logger(RecurringTransactionCron.name);

  constructor(private readonly recurringService: RecurringTransactionService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyRecurring(){
    this.logger.log('Processing due recurring transactions...');
    const results = await this.recurringService.processDueRecurring();
    this.logger.log(`Processed ${results.length} recurring transactions`);
  }
}
