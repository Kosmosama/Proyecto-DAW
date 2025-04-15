import { Module } from '@nestjs/common';
import { StatusGateway } from './status.gateway';
import { PlayerModule } from 'src/player/player.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { JwtWsGuard } from 'src/auth/guards/jwt-ws-auth.guard';

@Module({
  imports: [PlayerModule, JwtModule.register({}), ConfigModule],
  providers: [StatusGateway, JwtWsGuard],
})
export class StatusModule {}
