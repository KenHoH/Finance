import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AuthModule } from './modules/auth/auth.module.js';
import { AppService } from './app.service.js'
import { AppController } from './app.controller.js';
import { EmailModule } from './modules/email/email.module.js';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './modules/prisma/prisma.module.js';
import { TransactionModule } from './modules/transaction/transaction.module.js';
import { BudgetModule } from './modules/budget/budget.module.js';
import { GoalModule } from './modules/goal/goal.module.js';
import { SplitBillModule } from './modules/split-bill/split-bill.module.js';
import { CategoryModule } from './modules/category/category.module.js';
import { DashboardModule } from './modules/dashboard/dashboard.module.js';
import { NotificationModule } from './modules/notification/notification.module.js';
import { FriendModule } from './modules/friend/friend.module.js';
import { CsrfGuard } from './infrastructure/guards/csrf.guard.js';
import { LoggingMiddleware } from './infrastructure/middleware/logging.middleware.js';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 40 }]), //max 40request/60sec per ip
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    AuthModule,
    EmailModule,
    PrismaModule,
    TransactionModule,
    BudgetModule,
    GoalModule,
    SplitBillModule,
    CategoryModule,
    DashboardModule,
    NotificationModule,
    FriendModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: CsrfGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer){
    consumer.apply(LoggingMiddleware).forRoutes('*');
  }
}
