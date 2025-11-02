/**
 * Скрипт для показа SQL миграции данных
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;

if (!SUPABASE_URL) {
  console.error('❌ SUPABASE_URL не найден в .env файле');
  process.exit(1);
}

const projectRef = SUPABASE_URL.split('//')[1]?.split('.')[0];

if (!projectRef) {
  console.error('❌ Не удалось извлечь project ref из URL');
  process.exit(1);
}

const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20250103130000_migrate_existing_data.sql');
const migrationSQL = readFileSync(migrationPath, 'utf-8');

console.log('📋 SQL для миграции существующих данных:');
console.log('─'.repeat(60));
console.log(migrationSQL);
console.log('─'.repeat(60));
console.log('\n🌐 Откройте SQL Editor в Supabase Dashboard:');
console.log(`   https://supabase.com/dashboard/project/${projectRef}/sql/new`);
console.log('\n📝 Инструкция:');
console.log('   1. Скопируйте SQL выше');
console.log('   2. Вставьте в SQL Editor');
console.log('   3. Нажмите Run');
console.log('\n⚠️  ВНИМАНИЕ: Эта миграция назначает все данные без user_id');
console.log('   пользователю premiumservice23@gmail.com');
console.log('   Убедитесь что этот пользователь существует в auth.users!');

