import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { GoalController } from './framework/goal.controller.js';
import { GoalService } from './core/app/goal.service.js';
import { ActivityLogModule } from '../activity-log/activity-log.module.js';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
    ActivityLogModule,
  ],
  controllers: [GoalController],
  providers: [GoalService],
})
export class GoalModule {}