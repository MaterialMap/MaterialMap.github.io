# 🚀 Полное руководство по настройке Material MAP + Supabase

## Этап 1: Настройка базы данных

### 1.1. Применение схемы

В **Supabase Dashboard** → **SQL Editor** выполните:

```sql
-- Скопируйте содержимое файла db/quick_setup.sql
-- или полную версию из db/supabase_migration.sql
```

### 1.2. Добавление демонстрационных данных

После создания схемы выполните:

```sql
-- Скопируйте содержимое файла db/demo_data.sql
```

### 1.3. Проверка структуры

Убедитесь что созданы таблицы:
- ✅ `materials` - основная таблица материалов
- ✅ `applications` - применения материалов  
- ✅ `references` - источники публикаций
- ✅ `material_curves` - кривые и табличные данные
- ✅ `material_applications` - связи материалов и применений
- ✅ `material_references` - связи материалов и источников
- ✅ `materials_full` - представление с агрегированными данными

## Этап 2: Получение API ключей

1. В **Supabase Dashboard** → **Settings** → **API**
2. Скопируйте:
   - **Project URL**: `https://vqoyeihxdpsezodsbjvh.supabase.co`
   - **Anon key**: для фронтенда (публичный доступ)
   - **Service role key**: для импорта данных (секретный!)

## Этап 3: Быстрая проверка

### 3.1. Демонстрационная страница

Откройте файл `supabase-demo.html` в браузере:

1. Вставьте **Project URL** и **Anon key**
2. Нажмите "Подключиться" 
3. Должна появиться статистика БД
4. Попробуйте поиск материалов

### 3.2. SQL проверка

Выполните в **SQL Editor**:

```sql
-- Проверяем количество данных
SELECT 
  (SELECT count(*) FROM materials) as materials_count,
  (SELECT count(*) FROM applications) as applications_count,
  (SELECT count(*) FROM references) as references_count;

-- Тестируем представление materials_full
SELECT * FROM materials_full LIMIT 3;

-- Проверяем поиск
SELECT name, material_type_code, density 
FROM materials 
WHERE material_type_code = 'MAT_PLASTIC_KINEMATIC';
```

## Этап 4: Импорт реальных данных

### 4.1. Настройка переменных окружения

```bash
cp .env.example .env
# Отредактируйте .env своими ключами
```

### 4.2. Установка зависимостей

```bash
npm install @supabase/supabase-js smol-toml
```

### 4.3. Импорт TOML файлов

```bash
# Предварительный просмотр
npm run import-to-supabase:dry-run

# Полный импорт всех файлов
npm run import-to-supabase

# Импорт конкретного файла
node scripts/import-to-supabase.js --file="Walvekar 2010.toml"
```

## Этап 5: Интеграция с существующим кодом

### 5.1. Замена загрузки TOML

```javascript
// Старый код
// import { loadTomlFiles } from './MaterialApp.js';
// const materials = await loadTomlFiles();

// Новый код
import { SupabaseMaterialLoader } from './src/js/examples/supabase-integration.js';
const loader = new SupabaseMaterialLoader();
const materials = await loader.loadMaterials();
```

### 5.2. Интеграция с DataTable

```javascript
import { SupabaseDataTableAdapter } from './src/js/examples/supabase-integration.js';

const adapter = new SupabaseDataTableAdapter('#materials-table');
const table = await adapter.initializeDataTable({
  pageLength: 25,
  responsive: true
});
```

### 5.3. Использование API

```javascript
import { materialsAPI } from './src/js/config/supabase.js';

// Поиск материалов
const results = await materialsAPI.getMaterials({
  search: 'aluminum',
  materialType: 'MAT_ELASTIC',
  densityRange: { min: 1000, max: 5000 },
  limit: 50
});

// Получить статистику
const stats = await materialsAPI.getStats();

// Экспорт в LS-DYNA
const lsdynaData = await materialsAPI.exportMaterial(materialId);
```

## Этап 6: Производственное развертывание

### 6.1. Обновление конфигурации

В `src/js/config/supabase.js`:

```javascript
const SUPABASE_CONFIG = {
  url: process.env.SUPABASE_URL || 'https://vqoyeihxdpsezodsbjvh.supabase.co',
  anonKey: process.env.SUPABASE_ANON_KEY || 'your-anon-key'
};
```

### 6.2. Мониторинг

- Используйте **Supabase Dashboard** для мониторинга запросов
- Настройте алерты на превышение лимитов в **Settings** → **Usage**
- Регулярно делайте backup в **Settings** → **Database** → **Backup**

## 🔍 Troubleshooting

### Проблема: "relation does not exist"
**Решение**: Примените схему полностью из `db/supabase_migration.sql`

### Проблема: "permission denied for table"
**Решение**: Проверьте RLS политики и используйте правильные API ключи

### Проблема: Медленные запросы
**Решение**: Используйте пагинацию `.range()` и фильтры по индексированным полям

### Проблема: Импорт данных не работает
**Решение**: 
- Проверьте переменные окружения
- Используйте **Service Role key** (не Anon key)
- Проверьте формат TOML файлов

## 📊 Полезные SQL запросы

```sql
-- Топ применений материалов
SELECT name, COUNT(*) as count
FROM applications a
JOIN material_applications ma ON a.id = ma.application_id
GROUP BY name ORDER BY count DESC LIMIT 10;

-- Материалы по типам
SELECT material_type_code, COUNT(*) as count,
       AVG(density) as avg_density
FROM materials 
WHERE material_type_code IS NOT NULL
GROUP BY material_type_code ORDER BY count DESC;

-- Поиск по плотности
SELECT name, density, material_type_code 
FROM materials 
WHERE density BETWEEN 2000 AND 8000 
ORDER BY density;

-- Полнотекстовый поиск (если добавлена функция)
-- SELECT * FROM search_materials('aluminum ballistic');
```

## 🎯 Что получилось

✅ **Масштабируемость**: Поддержка тысяч материалов  
✅ **Производительность**: Быстрый поиск с индексами  
✅ **Гибкость**: JSONB данные + сырые LS-DYNA тексты  
✅ **Безопасность**: RLS политики и контроль доступа  
✅ **Совместимость**: Работает с существующим кодом  
✅ **Мониторинг**: Встроенные средства Supabase Dashboard  

## 📞 Поддержка

- [Документация Supabase](https://supabase.com/docs)
- [JavaScript SDK](https://supabase.com/docs/reference/javascript)
- [SQL Reference](https://supabase.com/docs/guides/database)

Система готова к использованию! 🚀