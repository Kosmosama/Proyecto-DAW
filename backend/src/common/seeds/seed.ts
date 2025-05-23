import { DataSource } from 'typeorm';
import { seedPlayers } from './player.seeder';

export async function runSeeders(dataSource: DataSource): Promise<void> {
  console.log('🔁 Running seeders...');

  try {
    await seedPlayers(dataSource);
    console.log('✅ Player seeder completed');
  } catch (error) {
    console.error('❌ Error running seeders:', error);
  }
}
