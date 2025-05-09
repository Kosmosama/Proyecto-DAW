import { Module } from '@nestjs/common';
import { RedisModule as NestJsRedisModule } from '@nestjs-modules/ioredis';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
    imports: [
        NestJsRedisModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({ // Doesnt work, i dont know why, help :s
                config: {
                    host: config.get<string>('REDIS_HOST') || 'localhost',
                    port: config.get<number>('REDIS_PORT') || 6379,
                },
            }),
        }),
    ],
    exports: [NestJsRedisModule],
})
export class RedisModule { }