import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { IdentityModule } from './modules/identity/identity.module';
import { LedgerModule } from './modules/ledger/ledger.module'

@Module({
  imports: [IdentityModule, LedgerModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}