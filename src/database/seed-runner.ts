import 'dotenv/config';


import { AppDataSource } from './data-source';
import { runSeeds } from './seeds';

async function bootstrap() {
  await AppDataSource.initialize();
  try {
    await runSeeds(AppDataSource);
    console.log('✅ Seeds ejecutados');
  } finally {
    await AppDataSource.destroy();
  }
}

bootstrap().catch((err) => {
  console.error('❌ Seed error:', err);
  process.exit(1);
});