import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from 'prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { AssetsModule } from './assets/assets.module';
import { HealthController } from './health/health.controller';
import { GiftpacksModule } from './giftpacks/giftpacks.module';
import { ClaimModule } from './claim/claim.module';

@Module({
  imports: [AuthModule, PrismaModule, AssetsModule, ConfigModule.forRoot({ isGlobal: true }),
  CacheModule.register({ ttl: 60 }),
  GiftpacksModule,
  ClaimModule,   ],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule { }
