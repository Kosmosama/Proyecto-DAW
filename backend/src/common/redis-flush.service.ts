import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

@Injectable()
export class RedisFlushService implements OnModuleInit {
    private readonly logger = new Logger(RedisFlushService.name);

    constructor(
        @InjectRedis() private readonly redis: Redis
    ) { }

    async onModuleInit() {
        await this.redis.flushall();
        this.logger.log('Redis FLUSHALL executed on module init');
    }
}