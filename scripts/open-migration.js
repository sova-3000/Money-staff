/**
 * Скрипт для открытия SQL Editor с готовой миграцией
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

// Извлекаем project ref из URL
const projectRef = SUPABASE_URL.split('//')[1]?.split('.')[0];

if (!projectRef) {
  console.error('❌ Не удалось извлечь project ref из URL');
  process.exit(1);
}

// Читаем миграцию
const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20250103120000_fix_multiuser_setup.sql');
const migrationSQL = readFileSync(migrationPath, 'utf-8');

console.log('📋 Миграция для применения:');
console.log('─'.repeat(60));
console.log(migrationSQL);
console.log('─'.repeat(60));
console.log('\n🌐 Откройте SQL Editor в Supabase Dashboard:');
console.log(`   https://supabase.com/dashboard/project/${projectRef}/sql/new`);
console.log('\n📝 Инструкция:');
console.log('   1. Скопируйте SQL выше');
console.log('   2. Вставьте в SQL Editor');
console.log('   3. Нажмите Run');

