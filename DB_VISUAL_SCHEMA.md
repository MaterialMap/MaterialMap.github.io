# 📊 Визуальная схема базы данных Material MAP

## 🗺️ Общая структура

```
                    📚 REFERENCES                    🏷️ APPLICATIONS
                   ┌─────────────────┐              ┌──────────────────┐
                   │ id (Primary)    │              │ id (Primary)     │
                   │ title          │              │ name            │
                   │ url            │              │ category        │
                   │ doi            │              │ description     │
                   │ year           │              └──────────────────┘
                   │ authors        │                        ▲
                   └─────────────────┘                        │
                            ▲                                 │
                            │                                 │
                   ┌─────────────────┐              ┌──────────────────┐
                   │ MATERIAL_       │              │ MATERIAL_        │
                   │ REFERENCES      │              │ APPLICATIONS     │
                   │                 │              │                  │
                   │ material_id  ◄──┼──────────────┼──► material_id   │
                   │ reference_id    │              │    application_id│
                   └─────────────────┘              └──────────────────┘
                            │                                 │
                            ▼                                 ▼
                   ┌─────────────────────────────────────────────────────────┐
                   │                 📦 MATERIALS                            │
                   │                 (Главная таблица)                       │
                   │                                                         │
                   │ id (Primary Key) ← уникальный номер                     │
                   │ name            ← название материала                    │
                   │ material_type_code ← связь с MATERIAL_TYPES             │
                   │ density         ← плотность (число)                     │
                   │ youngs_modulus  ← модуль Юнга                          │
                   │ mat_data_raw    ← полный LS-DYNA код                    │
                   │ units           ← система единиц                        │
                   │ source_file     ← откуда импортировано                  │
                   │ search_vector   ← для полнотекстового поиска            │
                   │ created_at      ← когда создано                         │
                   │ updated_at      ← когда обновлено                       │
                   └─────────────────────────────────────────────────────────┘
                                              │
                                              ▼
                   ┌─────────────────┐              ┌──────────────────┐
                   │ 🧮 MATERIAL_    │              │ 📈 MATERIAL_     │
                   │ TYPES           │              │ CURVES           │
                   │                 │              │                  │
                   │ id              │              │ id               │
                   │ ls_dyna_code    │              │ material_id      │
                   │ name            │              │ curve_id         │
                   │ description     │              │ curve_data       │
                   └─────────────────┘              │ curve_type       │
                                                    └──────────────────┘
```

## 🔗 Типы связей

### 1️⃣ Один-ко-многим (One-to-Many)
```
MATERIAL_TYPES ──────1────┬────N──── MATERIALS
                          │
               Один тип может быть у многих материалов
               Один материал имеет только один тип
```

### 2️⃣ Многие-ко-многим (Many-to-Many)
```
MATERIALS ────N────┬────N──── APPLICATIONS
                   │
            MATERIAL_APPLICATIONS
             (связующая таблица)

Пример:
- Aluminum → [Automotive, Aerospace, Marine]  
- Automotive → [Steel, Aluminum, Carbon Fiber]
```

## 📋 Подробная схема таблиц

### 📦 MATERIALS (Основная таблица)
```sql
CREATE TABLE materials (
    id                  BIGSERIAL PRIMARY KEY,
    name               TEXT NOT NULL,
    material_type_code TEXT REFERENCES material_types(ls_dyna_code),
    density            BIGINT,
    youngs_modulus     NUMERIC,
    poissons_ratio     NUMERIC,
    yield_strength     NUMERIC,
    ultimate_strength  NUMERIC,
    mat_data_raw       TEXT,
    eos_data_raw       TEXT,
    mat_add_data_raw   TEXT,
    units              TEXT,
    source_file        TEXT,
    comments           TEXT,
    search_vector      tsvector, -- Для полнотекстового поиска
    created_at         TIMESTAMP DEFAULT now(),
    updated_at         TIMESTAMP DEFAULT now()
);
```

### 🏷️ APPLICATIONS (Применения)
```sql
CREATE TABLE applications (
    id          BIGSERIAL PRIMARY KEY,
    name        TEXT UNIQUE NOT NULL,
    category    TEXT, -- 'industry', 'simulation_type', 'application'
    description TEXT,
    created_at  TIMESTAMP DEFAULT now()
);
```

### 📚 REFERENCES (Источники)
```sql  
CREATE TABLE references (
    id         BIGSERIAL PRIMARY KEY,
    title      TEXT,
    url        TEXT,
    doi        TEXT,
    year       INTEGER,
    authors    TEXT[],
    journal    TEXT,
    created_at TIMESTAMP DEFAULT now()
);
```

### 🔗 Связующие таблицы
```sql
-- Материалы ↔ Применения
CREATE TABLE material_applications (
    material_id    BIGINT REFERENCES materials(id),
    application_id BIGINT REFERENCES applications(id),
    PRIMARY KEY (material_id, application_id)
);

-- Материалы ↔ Источники  
CREATE TABLE material_references (
    material_id  BIGINT REFERENCES materials(id),
    reference_id BIGINT REFERENCES references(id), 
    PRIMARY KEY (material_id, reference_id)
);
```

## 🎯 Представления (Views) - "Умные запросы"

### 1. materials_full - Полная информация
```sql
CREATE VIEW materials_full AS
SELECT 
    m.*,
    mt.name as material_type_name,
    -- Собираем все применения в массив
    ARRAY_AGG(DISTINCT a.name) as applications,
    -- Собираем все источники в массив  
    ARRAY_AGG(DISTINCT r.url) as reference_urls
FROM materials m
LEFT JOIN material_types mt ON m.material_type_code = mt.ls_dyna_code
LEFT JOIN material_applications ma ON m.id = ma.material_id
LEFT JOIN applications a ON ma.application_id = a.id  
LEFT JOIN material_references mr ON m.id = mr.material_id
LEFT JOIN references r ON mr.reference_id = r.id
GROUP BY m.id, mt.name;
```

### 2. materials_search - Для поиска
```sql
CREATE VIEW materials_search AS  
SELECT 
    m.id,
    m.name,
    m.density,
    m.material_type_code,
    -- Создаем поисковый вектор из всех текстовых полей
    setweight(to_tsvector('english', COALESCE(m.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(m.comments, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(string_agg(a.name, ' '), '')), 'C')
    as search_vector
FROM materials m
LEFT JOIN material_applications ma ON m.id = ma.material_id
LEFT JOIN applications a ON ma.application_id = a.id
GROUP BY m.id;
```

## 🔍 Функции поиска

### 1. Текстовый поиск
```sql
CREATE OR REPLACE FUNCTION search_materials(search_query TEXT)
RETURNS TABLE(
    id BIGINT,
    name TEXT, 
    material_type_code TEXT,
    density BIGINT,
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.name,
        m.material_type_code, 
        m.density,
        ts_rank(ms.search_vector, plainto_tsquery('english', search_query)) as rank
    FROM materials m
    JOIN materials_search ms ON m.id = ms.id
    WHERE ms.search_vector @@ plainto_tsquery('english', search_query)
    ORDER BY rank DESC;
END;
$$ LANGUAGE plpgsql;
```

### 2. Поиск по диапазону плотности
```sql
CREATE OR REPLACE FUNCTION search_by_density(min_density BIGINT, max_density BIGINT)
RETURNS TABLE(
    id BIGINT,
    name TEXT,
    density BIGINT, 
    material_type_code TEXT,
    units TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT m.id, m.name, m.density, m.material_type_code, m.units
    FROM materials m  
    WHERE m.density BETWEEN min_density AND max_density
    ORDER BY m.density;
END;
$$ LANGUAGE plpgsql;
```

## 🚀 Индексы для производительности

```sql
-- Основные индексы
CREATE INDEX idx_materials_density ON materials(density);
CREATE INDEX idx_materials_type ON materials(material_type_code);
CREATE INDEX idx_materials_search ON materials USING GIN(search_vector);

-- Индексы для связующих таблиц
CREATE INDEX idx_material_apps_mat ON material_applications(material_id);
CREATE INDEX idx_material_apps_app ON material_applications(application_id);
CREATE INDEX idx_material_refs_mat ON material_references(material_id);
CREATE INDEX idx_material_refs_ref ON material_references(reference_id);
```

## 🛡️ Безопасность (Row Level Security)

```sql
-- Включаем RLS для всех таблиц
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE references ENABLE ROW LEVEL SECURITY;

-- Правила доступа
CREATE POLICY "Materials are viewable by everyone" ON materials
    FOR SELECT USING (true);

CREATE POLICY "Materials are editable by authenticated users" ON materials  
    FOR ALL USING (auth.role() = 'authenticated');
```

## 💡 Как это все работает вместе?

### Пример запроса: "Найти легкие материалы для авиации"

```sql
-- 1. Ищем материалы с низкой плотностью
WITH light_materials AS (
    SELECT * FROM search_by_density(1000000, 3000000)  
),
-- 2. Среди них ищем те, что используются в авиации
aerospace_materials AS (
    SELECT m.* FROM light_materials m
    JOIN material_applications ma ON m.id = ma.material_id
    JOIN applications a ON ma.application_id = a.id
    WHERE a.name = 'Aerospace structures'
)
-- 3. Получаем полную информацию
SELECT * FROM materials_full 
WHERE id IN (SELECT id FROM aerospace_materials);
```

### Результат:
```
┌──────────────────┬─────────────┬─────────────────┬──────────────────────┐
│ name             │ density     │ material_type   │ applications         │
├──────────────────┼─────────────┼─────────────────┼──────────────────────┤
│ Aluminum 6061-T6 │ 2700000000  │ MAT_ELASTIC     │ [Aerospace, Auto]    │
│ Carbon Fiber     │ 1600000000  │ MAT_ORTHOTROPIC │ [Aerospace, Racing]  │
└──────────────────┴─────────────┴─────────────────┴──────────────────────┘
```

Это и есть магия хорошо спроектированной базы данных! 🎉