import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { SplitBillController } from './framework/split-bill-controller.js';
import { SplitBillService } from './core/app/split-bill.service.js';
import { SupabaseStorageService } from './core/app/supabase-storage.service.js';
import { FriendModule } from '../friend/friend.module.js';
import { NotificationModule } from '../notification/notification.module.js';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
    FriendModule,
    NotificationModule,
  ],
  controllers: [SplitBillController],
  providers: [SplitBillService, SupabaseStorageService],
})
export class SplitBillModule {}
