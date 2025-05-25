import { NestFactory } from '@nestjs/core';
import { SeederModule } from './seeds/seeder.module';
import { PlayerSeeder } from './seeds/player.seeder';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(SeederModule);
  const seeder = app.get(PlayerSeeder);

  await seeder.seed();

  await app.close();
}
bootstrap();