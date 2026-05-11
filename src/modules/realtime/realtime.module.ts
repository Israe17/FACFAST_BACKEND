import { Module, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { UsersModule } from '../users/users.module';
import { RealtimeGateway } from './gateways/realtime.gateway';
import { RealtimeService } from './services/realtime.service';

/**
 * Realtime gateway and emitter facade. Imported once from AppModule;
 * other modules consume RealtimeService via standard DI to push events
 * to connected clients.
 *
 * JwtModule is registered here (not just re-exported from AuthModule)
 * because the gateway verifies access tokens using the same secret and
 * the registration is global to AuthModule via .register({}). We could
 * inject a shared JwtService but keeping the module self-contained
 * makes future swaps (e.g. moving sockets to a separate process) easier.
 */
@Module({
  imports: [
    forwardRef(() => UsersModule),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config_service: ConfigService) => ({
        secret: config_service.getOrThrow<string>('auth.access_token_secret'),
      }),
    }),
  ],
  providers: [RealtimeGateway, RealtimeService],
  exports: [RealtimeService],
})
export class RealtimeModule {}
