import { NestFactory } from '@nestjs/core';
import { SeederModule } from './seeder.module';
import { PlayerSeeder } from './player.seeder';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(SeederModule);
    const seeder = app.get(PlayerSeeder);
    await seeder.seed();
    await app.close();
}

bootstrap();