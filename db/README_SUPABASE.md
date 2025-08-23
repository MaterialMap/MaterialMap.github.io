# Material MAP - Интеграция с Supabase

Этот документ описывает полную интеграцию проекта Material MAP с базой данных Supabase для хранения и поиска материалов LS-DYNA.

## 🚀 Quick Start

### 1. Создание проекта Supabase

1. Зарегистрируйтесь на [supabase.com](https://supabase.com)
2. Создайте новый проект
3. Скопируйте URL проекта и API ключи

### 2. Настройка переменных окружения

```bash
# Скопируйте шаблон
cp .env.example .env

# Отредактируйте .env файл своими данными
nano .env
```

### 3. Применение схемы базы данных

```bash
# В Supabase Dashboard перейдите в SQL Editor
# Скопируйте и выполните содержимое файла:
cat db/supabase_migration.sql
```

### 4. Импорт данных из TOML файлов

```bash
# Предварительный просмотр (dry-run)
npm run import-to-supabase:dry-run

# Полный импорт
npm run import-to-supabase

# Импорт конкретного файла
node scripts/import-to-supabase.js --file="Walvekar 2010.toml"
```

### 5. Проверка данных

```bash
# Получить статистику БД
npm run supabase:stats
```

## 📊 Схема данных

### Основные таблицы:

- **`materials`** - Основная таблица материалов
- **`references`** - Источники и публикации  
- **`applications`** - Применения материалов
- **`material_curves`** - Кривые и табличные данные
- **`material_applications`** - Связь материалов и применений
- **`material_references`** - Связь материалов и источников

### Ключевые особенности:

✅ **Гибридное хранение**: Сырые LS-DYNA данные + парсированные параметры  
✅ **Полнотекстовый поиск** с поддержкой русского и английского  
✅ **Индексы** для быстрого поиска по параметрам  
✅ **RLS политики** для безопасности  
✅ **Функции поиска** для сложных запросов  

## 🔍 Примеры использования API

### Базовый поиск

```javascript
import { materialsAPI } from './src/js/config/supabase.js';

// Получить все материалы с пагинацией
const materials = await materialsAPI.getMaterials({
  page: 0,
  limit: 50,
  search: 'aluminum',
  sortBy: 'density'
});

// Поиск по типу материала
const elasticMaterials = await materialsAPI.getMaterials({
  materialType: 'MAT_ELASTIC'
});

// Диапазонный поиск по плотности
const denseMaterials = await materialsAPI.getMaterials({
  densityRange: { min: 2000, max: 8000 }
});
```

### Продвинутый поиск

```javascript
// Поиск по множественным параметрам
const results = await materialsAPI.advancedSearch({
  minDensity: 1000,
  maxDensity: 5000,
  minYoungsModulus: 50000,
  materialType: 'MAT_PLASTIC_KINEMATIC',
  application: 'ballistic'
});

// Полнотекстовый поиск с ранжированием
const searchResults = await materialsAPI.searchMaterials('aluminum ballistic');
```

### Получение деталей материала

```javascript
// Полная информация о материале
const material = await materialsAPI.getMaterial('uuid-here');

// Кривые материала
const curves = await materialsAPI.getMaterialCurves('uuid-here');

// Экспорт в LS-DYNA формат
const lsdynaData = await materialsAPI.exportMaterial('uuid-here');
```

## 🔄 Миграция с существующего кода

### Замена загрузки TOML файлов

```javascript
// Старый код
// const materials = await loadTomlFiles();

// Новый код
import { SupabaseMaterialLoader } from './src/js/examples/supabase-integration.js';
const loader = new SupabaseMaterialLoader();
const materials = await loader.loadMaterials();
```

### Интеграция с DataTables

```javascript
import { SupabaseDataTableAdapter } from './src/js/examples/supabase-integration.js';

const adapter = new SupabaseDataTableAdapter('#materials-table');
const table = await adapter.initializeDataTable({
  pageLength: 25,
  responsive: true
});
```

### Адаптер поиска

```javascript
import { SupabaseSearchManager } from './src/js/examples/supabase-integration.js';

const searchManager = new SupabaseSearchManager();

// Выполнить поиск
const results = await searchManager.performSearch('aluminum', {
  materialType: 'MAT_ELASTIC',
  densityRange: { min: 1000, max: 5000 }
});

// Прослушивать события поиска
window.addEventListener('search:completed', (event) => {
  console.log('Найдено:', event.detail.count, 'материалов');
  updateUI(event.detail.results);
});
```

## 📁 Структура файлов

```
db/
├── supabase_migration.sql      # Схема базы данных
├── SUPABASE_SCHEMA_DOCS.md    # Документация по схеме
├── material_schema.sql         # Оригинальная схема (для справки)
└── README_SUPABASE.md         # Этот файл

scripts/
└── import-to-supabase.js      # Скрипт импорта данных

src/js/
├── config/
│   └── supabase.js            # Конфигурация и API клиент
└── examples/
    └── supabase-integration.js # Примеры интеграции

.env.example                   # Шаблон переменных окружения
```

## 🛠 Полезные SQL запросы

### Статистика базы данных

```sql
-- Общая статистика
SELECT * FROM public.get_database_stats();

-- Топ применений материалов
SELECT name, COUNT(*) as materials_count
FROM applications a
JOIN material_applications ma ON a.id = ma.application_id
GROUP BY name
ORDER BY materials_count DESC
LIMIT 10;

-- Материалы по типам
SELECT material_type_code, COUNT(*) as count,
       AVG(density) as avg_density
FROM materials 
WHERE material_type_code IS NOT NULL
GROUP BY material_type_code
ORDER BY count DESC;
```

### Поиск и фильтрация

```sql
-- Полнотекстовый поиск
SELECT * FROM public.search_materials('aluminum ballistic');

-- Поиск по диапазону плотности
SELECT * FROM public.search_by_density(2000, 8000);

-- Комплексный поиск
SELECT * FROM public.search_by_properties(
  min_density := 1000,
  max_density := 5000,
  material_type_filter := 'MAT_ELASTIC'
);
```

## 🔧 Обслуживание и мониторинг

### Регулярные задачи

```bash
# Обновление статистики
npm run supabase:stats

# Проверка данных
node -e "
import('./src/js/config/supabase.js').then(async m => {
  const stats = await m.materialsAPI.getStats();
  console.log('Материалов в БД:', stats.materials_count);
  console.log('Источников:', stats.references_count);
});"

# Резервное копирование (из Supabase Dashboard)
# Settings > Database > Backup
```

### Мониторинг производительности

- Используйте Supabase Dashboard для мониторинга запросов
- Проверяйте использование индексов в медленных запросах
- Настройте алерты на превышение лимитов

## 🚨 Troubleshooting

### Частые проблемы

**Проблема**: Ошибка "relation does not exist"  
**Решение**: Убедитесь что схема БД применена полностью

**Проблема**: Медленные запросы  
**Решение**: Проверьте использование индексов, добавьте `.range()` для пагинации

**Проблема**: RLS ошибки доступа  
**Решение**: Проверьте политики безопасности, используйте правильные ключи API

**Проблема**: Импорт данных не работает  
**Решение**: Проверьте переменные окружения, используйте Service Role ключ

### Отладка

```javascript
// Включить отладку
localStorage.setItem('supabase.debug', 'true');

// Проверить подключение
import { supabase } from './src/js/config/supabase.js';
const { data, error } = await supabase.from('materials').select('count', { count: 'exact', head: true });
console.log('Подключение работает, материалов:', data);
```

## 📚 Дополнительные ресурсы

- [Документация Supabase](https://supabase.com/docs)
- [JavaScript Client](https://supabase.com/docs/reference/javascript)
- [SQL Reference](https://supabase.com/docs/guides/database)
- [RLS Policies](https://supabase.com/docs/guides/auth/row-level-security)

## 🤝 Contributing

При добавлении новых функций в Supabase интеграцию:

1. Обновите схему в `supabase_migration.sql`
2. Добавьте функции в `materialsAPI` класс
3. Создайте примеры использования
4. Обновите документацию
5. Добавьте тесты в Playwright

## 📄 License

Этот код распространяется под той же лицензией что и основной проект Material MAP (CC BY-NC).