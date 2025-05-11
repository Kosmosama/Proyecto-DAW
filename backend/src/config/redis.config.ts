import { RedisModuleAsyncOptions } from '@nestjs-modules/ioredis';
import { ConfigService } from '@nestjs/config';

export const redisAsyncConfig: RedisModuleAsyncOptions = {
    imports: [],
    inject: [ConfigService],
    useFactory: (configService: ConfigService) => ({
        type: 'single',
        url: configService.get<string>('REDIS_URL'),
    }),
};
