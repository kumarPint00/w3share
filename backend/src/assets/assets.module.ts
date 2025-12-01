import { Module } from '@nestjs/common';
import { AssetsService } from './assets.service';
import { ConfigModule } from '@nestjs/config';
import { AssetsController } from './assets.controller';

@Module({
    imports: [
        ConfigModule,
    ],
    providers: [AssetsService],
    controllers: [AssetsController],
})
export class AssetsModule {}
