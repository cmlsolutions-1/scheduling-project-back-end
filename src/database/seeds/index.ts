import { DataSource } from 'typeorm';

import { seedAdmin } from './seed-admin';



export async function runSeeds(ds: DataSource) {
  await seedAdmin(ds);
}
