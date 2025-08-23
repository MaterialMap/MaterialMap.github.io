# Material MAP - Схема данных Supabase

## Обзор

Данная документация описывает схему базы данных Supabase для проекта Material MAP. Схема оптимизирована для хранения материалов LS-DYNA с поддержкой полнотекстового поиска, фильтрации по параметрам и эффективных запросов.

## Архитектура данных

### Основные принципы
- **Гибридное хранение**: Сырые данные LS-DYNA сохраняются как TEXT, парсированные параметры — как JSONB
- **Нормализация**: Справочники выделены в отдельные таблицы для избежания дублирования
- **Производительность**: Индексы для быстрого поиска по тексту и численным параметрам
- **Безопасность**: RLS политики для контроля доступа

## Схема таблиц

### 1. materials (Основная таблица материалов)

```sql
CREATE TABLE public.materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Базовая информация
  name TEXT NOT NULL,
  description TEXT,
  units TEXT NOT NULL DEFAULT 'mm–s–tonne–N–MPa',
  
  -- Данные LS-DYNA (сырые и парсированные)
  mat_data_raw TEXT NOT NULL,
  mat_data_parsed JSONB,
  eos_data_raw TEXT,
  eos_data_parsed JSONB,
  mat_add_data_raw TEXT,
  mat_add_data_parsed JSONB,
  mat_thermal_data_raw TEXT,
  mat_thermal_data_parsed JSONB,
  
  -- Извлечённые параметры для поиска
  material_id INTEGER,
  material_type_code TEXT,
  density NUMERIC,
  youngs_modulus NUMERIC,
  poisson_ratio NUMERIC,
  yield_strength NUMERIC,
  
  -- Метаданные
  comments TEXT,
  source_file TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Полнотекстовый поиск
  search_vector TSVECTOR GENERATED ALWAYS AS (...)
);
```

**Ключевые особенности:**
- `mat_data_raw` — исходный текст LS-DYNA карты
- `mat_data_parsed` — JSON с извлечёнными параметрами
- `search_vector` — автоматически генерируемый вектор для полнотекстового поиска
- Извлечённые параметры дублируют данные из JSONB для быстрого поиска

### 2. references (Источники и публикации)

```sql
CREATE TABLE public.references (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  authors TEXT,
  year INTEGER,
  url TEXT,
  doi TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3. applications (Применения материалов)

```sql
CREATE TABLE public.applications (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Категории применений:**
- `material_type` — типы материалов (алюминий, сталь, etc.)
- `industry` — отрасли (автомобильная, аэрокосмическая, etc.)
- `simulation_type` — типы симуляций (краш-тесты, формовка, etc.)
- `application` — конкретные применения (баллистика, удар птицы, etc.)

### 4. material_curves (Кривые и табличные данные)

```sql
CREATE TABLE public.material_curves (
  id UUID PRIMARY KEY,
  material_id UUID REFERENCES materials(id),
  curve_type TEXT NOT NULL,
  curve_id INTEGER,
  curve_name TEXT,
  data_points JSONB NOT NULL,
  metadata JSONB DEFAULT '{}'
);
```

**Примеры кривых:**
- `DEFINE_CURVE` — кривые из LS-DYNA
- `stress_strain` — кривые деформации
- `temperature` — температурные зависимости

### 5. Связующие таблицы

```sql
-- Материалы ↔ Применения (many-to-many)
CREATE TABLE public.material_applications (
  material_id UUID REFERENCES materials(id),
  application_id UUID REFERENCES applications(id),
  PRIMARY KEY (material_id, application_id)
);

-- Материалы ↔ Источники (many-to-many)
CREATE TABLE public.material_references (
  material_id UUID REFERENCES materials(id),
  reference_id UUID REFERENCES references(id),
  PRIMARY KEY (material_id, reference_id)
);
```

## Представления (Views)

### materials_full
Полная информация о материале с агрегированными данными:

```sql
SELECT * FROM public.materials_full WHERE id = 'uuid-here';
```

Возвращает:
- Все поля материала
- Массив применений `applications`
- Массив названий источников `reference_titles`
- Массив URL источников `reference_urls`

### materials_search
Упрощённое представление для поиска:

```sql
SELECT * FROM public.materials_search 
WHERE applications_list ILIKE '%ballistic%';
```

## Полезные функции

### 1. Полнотекстовый поиск

```sql
-- Поиск по тексту с ранжированием
SELECT * FROM public.search_materials('aluminum ballistic');
```

### 2. Поиск по диапазону плотности

```sql
-- Материалы с плотностью от 2000 до 8000
SELECT * FROM public.search_by_density(2000, 8000);
```

### 3. Комплексный поиск по параметрам

```sql
-- Поиск металлов с заданными параметрами
SELECT * FROM public.search_by_properties(
  min_density := 7000,
  max_density := 9000,
  min_youngs_modulus := 150000,
  material_type_filter := 'MAT_PLASTIC_KINEMATIC'
);
```

### 4. Статистика базы данных

```sql
SELECT * FROM public.get_database_stats();
```

## Индексы для производительности

### Основные индексы:
- `idx_materials_search_vector` — GIN индекс для полнотекстового поиска
- `idx_materials_mat_data_parsed` — GIN индекс для JSONB данных
- `idx_materials_density` — B-tree для диапазонного поиска
- `idx_materials_density_youngs` — составной индекс для комбинированного поиска

### Текстовые индексы:
- `idx_materials_name_trgm` — триграммы для нечёткого поиска названий

## API примеры (JavaScript/TypeScript)

### Настройка клиента

```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://your-project.supabase.co'
const supabaseKey = 'your-anon-key'
const supabase = createClient(supabaseUrl, supabaseKey)
```

### Базовые запросы

```javascript
// Получить все материалы с пагинацией
const { data: materials, error } = await supabase
  .from('materials_full')
  .select('*')
  .range(0, 49)  // первые 50 записей

// Поиск по названию
const { data: results, error } = await supabase
  .from('materials_full')
  .select('*')
  .ilike('name', '%aluminum%')

// Поиск по типу материала
const { data: results, error } = await supabase
  .from('materials_full')
  .select('*')
  .eq('material_type_code', 'MAT_ELASTIC')

// Поиск по диапазону плотности
const { data: results, error } = await supabase
  .from('materials_full')
  .select('*')
  .gte('density', 1000)
  .lte('density', 5000)
```

### Продвинутые запросы

```javascript
// Полнотекстовый поиск через RPC
const { data: results, error } = await supabase
  .rpc('search_materials', { search_term: 'aluminum ballistic' })

// Поиск по параметрам через RPC
const { data: results, error } = await supabase
  .rpc('search_by_properties', {
    min_density: 2000,
    max_density: 8000,
    material_type_filter: 'MAT_PLASTIC_KINEMATIC'
  })

// Комплексный запрос с фильтрацией по применениям
const { data: results, error } = await supabase
  .from('materials_full')
  .select(`
    *,
    applications,
    reference_urls
  `)
  .contains('applications', ['ballistic'])
  .gte('density', 2000)
  .order('density')
```

### Работа с кривыми

```javascript
// Получить кривые для материала
const { data: curves, error } = await supabase
  .from('material_curves')
  .select('*')
  .eq('material_id', 'material-uuid')

// Получить только кривые DEFINE_CURVE
const { data: defineCurves, error } = await supabase
  .from('material_curves')
  .select('*')
  .eq('curve_type', 'DEFINE_CURVE')
  .eq('material_id', 'material-uuid')
```

### Агрегированные данные

```javascript
// Получить статистику
const { data: stats, error } = await supabase
  .rpc('get_database_stats')

// Получить список всех применений
const { data: applications, error } = await supabase
  .from('applications')
  .select('name, description, category')
  .order('category, name')

// Получить материалы по источнику
const { data: materials, error } = await supabase
  .from('materials_full')
  .select('*')
  .contains('reference_urls', ['https://example.com'])
```

## Миграция данных

### Импорт из TOML

Используйте скрипт `scripts/import-to-supabase.js`:

```bash
# Предварительный просмотр
node scripts/import-to-supabase.js --dry-run

# Импорт всех файлов
SUPABASE_URL="your-url" SUPABASE_SERVICE_ROLE_KEY="your-key" \
node scripts/import-to-supabase.js

# Импорт конкретного файла
node scripts/import-to-supabase.js --file="Walvekar 2010.toml"
```

### Структура данных в TOML

```toml
[[material]]
mat_data = """
*MAT_ELASTIC_TITLE
Material Name
$--------1---------2---------3---------4---------5---------6---------7---------8
$#     MID        RO         E        PR
         1   7.85e-6    200000      0.29
"""

app = [
  "Primary material type",
  "Application area",
  "Use case"
]

url = "https://example.com/source"
ref = "Author, A. (Year). Title. Journal."
units = "mm–s–tonne–N–MPa"
comments = "Additional notes"
```

## Оптимизация производительности

### Рекомендации для запросов:

1. **Используйте RPC функции** для сложного поиска
2. **Ограничивайте результаты** с помощью `.range()` или `.limit()`
3. **Выбирайте только нужные поля** в `.select()`
4. **Используйте индексированные поля** для сортировки и фильтрации

### Примеры оптимизированных запросов:

```javascript
// ✅ Хорошо - используем индексированные поля
const { data } = await supabase
  .from('materials')
  .select('id, name, density, material_type_code')
  .eq('material_type_code', 'MAT_ELASTIC')
  .range(0, 19)

// ❌ Плохо - полнотекстовый поиск по неиндексированному полю
const { data } = await supabase
  .from('materials')
  .select('*')
  .ilike('mat_data_raw', '%some text%')

// ✅ Лучше - используем RPC для полнотекстового поиска
const { data } = await supabase
  .rpc('search_materials', { search_term: 'some text' })
```

## Безопасность (RLS)

Настроены следующие политики:
- **Публичное чтение**: Все данные доступны для чтения анонимным пользователям
- **Ограниченная запись**: Только аутентифицированные пользователи могут изменять данные

### Кастомизация политик:

```sql
-- Пример: ограничить доступ к определённым материалам
CREATE POLICY "Restricted materials access" 
  ON public.materials 
  FOR SELECT 
  USING (
    material_type_code NOT IN ('CLASSIFIED_MATERIAL')
    OR auth.role() = 'authenticated'
  );
```

## Мониторинг и аналитика

### Полезные запросы для мониторинга:

```sql
-- Топ-10 самых популярных применений
SELECT name, COUNT(*) as materials_count
FROM applications a
JOIN material_applications ma ON a.id = ma.application_id
GROUP BY name
ORDER BY materials_count DESC
LIMIT 10;

-- Статистика по типам материалов
SELECT material_type_code, COUNT(*) as count,
       AVG(density) as avg_density,
       AVG(youngs_modulus) as avg_youngs_modulus
FROM materials 
WHERE material_type_code IS NOT NULL
GROUP BY material_type_code
ORDER BY count DESC;

-- Источники с наибольшим количеством материалов
SELECT r.title, r.url, COUNT(*) as materials_count
FROM references r
JOIN material_references mr ON r.id = mr.reference_id
GROUP BY r.id, r.title, r.url
ORDER BY materials_count DESC;
```