import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { IdentityModule } from './identity/identity.module';
import { IdentityModule } from './modules/identity/identity.module';
import { LedgerModule } from './modules/ledger/ledger.module';
import { LedgarModule } from './modules/ledgar/ledgar.module';

@Module({
  imports: [IdentityModule, LedgerModule, LedgarModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
