-- ============================================
-- СХЕМА БАЗЫ ДАННЫХ ДЛЯ MATERIAL MAP в SUPABASE
-- ============================================

-- Включаем расширения
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================
-- ОСНОВНЫЕ ТАБЛИЦЫ
-- ============================================

-- Справочник источников (references/publications)
CREATE TABLE IF NOT EXISTS public.references (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  authors TEXT,
  year INTEGER,
  publication TEXT,
  url TEXT,
  doi TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Справочник типов материалов 
CREATE TABLE IF NOT EXISTS public.material_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Справочник применений/областей использования
CREATE TABLE IF NOT EXISTS public.applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT, -- 'material_type', 'industry', 'simulation_type', etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Основная таблица материалов
CREATE TABLE IF NOT EXISTS public.materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Базовая информация
  name TEXT NOT NULL,
  description TEXT,
  units TEXT NOT NULL DEFAULT 'mm–s–tonne–N–MPa',
  
  -- Данные материала в формате LS-DYNA (сохраняем как текст и JSONB)
  mat_data_raw TEXT NOT NULL, -- Исходный текст LS-DYNA карт
  mat_data_parsed JSONB, -- Парсированные параметры для поиска
  
  -- Дополнительные данные (опциональные)
  eos_data_raw TEXT,
  eos_data_parsed JSONB,
  mat_add_data_raw TEXT,
  mat_add_data_parsed JSONB,
  mat_thermal_data_raw TEXT,
  mat_thermal_data_parsed JSONB,
  
  -- Извлечённые ключевые параметры для быстрого поиска
  material_id INTEGER, -- MID из LS-DYNA
  material_type_code TEXT, -- Тип материала из *MAT_XXX
  density NUMERIC, -- RO
  youngs_modulus NUMERIC, -- E or YM
  poisson_ratio NUMERIC, -- PR
  yield_strength NUMERIC, -- SIGY
  
  -- Дополнительные поля
  comments TEXT,
  source_file TEXT, -- Имя исходного TOML файла
  
  -- Метаданные
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Полнотекстовый поиск
  search_vector TSVECTOR GENERATED ALWAYS AS (
    to_tsvector('english', 
      COALESCE(name, '') || ' ' || 
      COALESCE(description, '') || ' ' ||
      COALESCE(comments, '') || ' ' ||
      COALESCE(material_type_code, '')
    )
  ) STORED
);

-- Связь материалов с применениями (many-to-many)
CREATE TABLE IF NOT EXISTS public.material_applications (
  material_id UUID REFERENCES public.materials(id) ON DELETE CASCADE,
  application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
  PRIMARY KEY (material_id, application_id)
);

-- Связь материалов с источниками (many-to-many)
CREATE TABLE IF NOT EXISTS public.material_references (
  material_id UUID REFERENCES public.materials(id) ON DELETE CASCADE,
  reference_id UUID REFERENCES public.references(id) ON DELETE CASCADE,
  PRIMARY KEY (material_id, reference_id)
);

-- Таблица для кривых и табличных данных
CREATE TABLE IF NOT EXISTS public.material_curves (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  material_id UUID REFERENCES public.materials(id) ON DELETE CASCADE,
  curve_type TEXT NOT NULL, -- 'DEFINE_CURVE', 'stress_strain', 'temperature', etc.
  curve_id INTEGER, -- LCID из LS-DYNA
  curve_name TEXT,
  data_points JSONB NOT NULL, -- [{x: value, y: value}, ...]
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ИНДЕКСЫ ДЛЯ ПРОИЗВОДИТЕЛЬНОСТИ
-- ============================================

-- Индексы для полнотекстового поиска
CREATE INDEX IF NOT EXISTS idx_materials_search_vector 
  ON public.materials USING GIN(search_vector);

-- Индексы для JSONB полей
CREATE INDEX IF NOT EXISTS idx_materials_mat_data_parsed 
  ON public.materials USING GIN(mat_data_parsed);
CREATE INDEX IF NOT EXISTS idx_materials_eos_data_parsed 
  ON public.materials USING GIN(eos_data_parsed);

-- Индексы для численных параметров
CREATE INDEX IF NOT EXISTS idx_materials_material_id 
  ON public.materials(material_id);
CREATE INDEX IF NOT EXISTS idx_materials_material_type_code 
  ON public.materials(material_type_code);
CREATE INDEX IF NOT EXISTS idx_materials_density 
  ON public.materials(density);
CREATE INDEX IF NOT EXISTS idx_materials_youngs_modulus 
  ON public.materials(youngs_modulus);
CREATE INDEX IF NOT EXISTS idx_materials_yield_strength 
  ON public.materials(yield_strength);

-- Составные индексы для диапазонного поиска
CREATE INDEX IF NOT EXISTS idx_materials_density_youngs 
  ON public.materials(density, youngs_modulus);
CREATE INDEX IF NOT EXISTS idx_materials_type_density 
  ON public.materials(material_type_code, density);

-- Индексы для связей
CREATE INDEX IF NOT EXISTS idx_material_curves_material_id 
  ON public.material_curves(material_id);
CREATE INDEX IF NOT EXISTS idx_material_curves_type 
  ON public.material_curves(curve_type);

-- Индексы для текстового поиска
CREATE INDEX IF NOT EXISTS idx_materials_name_trgm 
  ON public.materials USING GIN(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_references_title_trgm 
  ON public.references USING GIN(title gin_trgm_ops);

-- ============================================
-- ТРИГГЕРЫ
-- ============================================

-- Функция для обновления updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггеры для обновления updated_at
DROP TRIGGER IF EXISTS handle_materials_updated_at ON public.materials;
CREATE TRIGGER handle_materials_updated_at
  BEFORE UPDATE ON public.materials
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_references_updated_at ON public.references;
CREATE TRIGGER handle_references_updated_at
  BEFORE UPDATE ON public.references
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- RLS ПОЛИТИКИ БЕЗОПАСНОСТИ
-- ============================================

-- Включаем RLS для всех таблиц
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.references ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_curves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_references ENABLE ROW LEVEL SECURITY;

-- Политики для чтения (публичный доступ)
DROP POLICY IF EXISTS "Materials are viewable by everyone" ON public.materials;
CREATE POLICY "Materials are viewable by everyone" 
  ON public.materials FOR SELECT USING (true);

DROP POLICY IF EXISTS "Applications are viewable by everyone" ON public.applications;
CREATE POLICY "Applications are viewable by everyone" 
  ON public.applications FOR SELECT USING (true);

DROP POLICY IF EXISTS "References are viewable by everyone" ON public.references;
CREATE POLICY "References are viewable by everyone" 
  ON public.references FOR SELECT USING (true);

DROP POLICY IF EXISTS "Material types are viewable by everyone" ON public.material_types;
CREATE POLICY "Material types are viewable by everyone" 
  ON public.material_types FOR SELECT USING (true);

DROP POLICY IF EXISTS "Material curves are viewable by everyone" ON public.material_curves;
CREATE POLICY "Material curves are viewable by everyone" 
  ON public.material_curves FOR SELECT USING (true);

DROP POLICY IF EXISTS "Material applications are viewable by everyone" ON public.material_applications;
CREATE POLICY "Material applications are viewable by everyone" 
  ON public.material_applications FOR SELECT USING (true);

DROP POLICY IF EXISTS "Material references are viewable by everyone" ON public.material_references;
CREATE POLICY "Material references are viewable by everyone" 
  ON public.material_references FOR SELECT USING (true);

-- Политики для записи (только аутентифицированные пользователи)
DROP POLICY IF EXISTS "Materials are editable by authenticated users" ON public.materials;
CREATE POLICY "Materials are editable by authenticated users" 
  ON public.materials FOR ALL USING (auth.role() = 'authenticated');

-- ============================================
-- ПРЕДСТАВЛЕНИЯ ДЛЯ УДОБСТВА
-- ============================================

-- Полное представление материала с агрегированными данными
DROP VIEW IF EXISTS public.materials_full;
CREATE VIEW public.materials_full AS
SELECT 
  m.id,
  m.name,
  m.description,
  m.units,
  m.mat_data_raw,
  m.mat_data_parsed,
  m.eos_data_raw,
  m.eos_data_parsed,
  m.mat_add_data_raw,
  m.mat_add_data_parsed,
  m.mat_thermal_data_raw,
  m.mat_thermal_data_parsed,
  m.material_id,
  m.material_type_code,
  m.density,
  m.youngs_modulus,
  m.poisson_ratio,
  m.yield_strength,
  m.comments,
  m.source_file,
  m.created_at,
  m.updated_at,
  
  -- Агрегированные данные
  COALESCE(
    ARRAY_AGG(DISTINCT a.name ORDER BY a.name) FILTER (WHERE a.name IS NOT NULL), 
    ARRAY[]::TEXT[]
  ) as applications,
  
  COALESCE(
    ARRAY_AGG(DISTINCT r.title ORDER BY r.title) FILTER (WHERE r.title IS NOT NULL), 
    ARRAY[]::TEXT[]
  ) as reference_titles,
  
  COALESCE(
    ARRAY_AGG(DISTINCT r.url ORDER BY r.url) FILTER (WHERE r.url IS NOT NULL), 
    ARRAY[]::TEXT[]
  ) as reference_urls
  
FROM public.materials m
LEFT JOIN public.material_applications ma ON m.id = ma.material_id
LEFT JOIN public.applications a ON ma.application_id = a.id
LEFT JOIN public.material_references mr ON m.id = mr.material_id
LEFT JOIN public.references r ON mr.reference_id = r.id
GROUP BY m.id, m.name, m.description, m.units, m.mat_data_raw, m.mat_data_parsed,
         m.eos_data_raw, m.eos_data_parsed, m.mat_add_data_raw, m.mat_add_data_parsed,
         m.mat_thermal_data_raw, m.mat_thermal_data_parsed, m.material_id, 
         m.material_type_code, m.density, m.youngs_modulus, m.poisson_ratio, 
         m.yield_strength, m.comments, m.source_file, m.created_at, m.updated_at;

-- Упрощённое представление для поиска
DROP VIEW IF EXISTS public.materials_search;
CREATE VIEW public.materials_search AS
SELECT 
  m.id,
  m.name,
  m.description,
  m.material_type_code,
  m.density,
  m.youngs_modulus,
  m.poisson_ratio,
  m.yield_strength,
  m.units,
  STRING_AGG(DISTINCT a.name, ', ') as applications_list,
  STRING_AGG(DISTINCT r.url, ', ') as reference_urls_list
FROM public.materials m
LEFT JOIN public.material_applications ma ON m.id = ma.material_id
LEFT JOIN public.applications a ON ma.application_id = a.id
LEFT JOIN public.material_references mr ON m.id = mr.material_id
LEFT JOIN public.references r ON mr.reference_id = r.id
GROUP BY m.id, m.name, m.description, m.material_type_code, 
         m.density, m.youngs_modulus, m.poisson_ratio, m.yield_strength, m.units;

-- ============================================
-- ПОЛЕЗНЫЕ ФУНКЦИИ
-- ============================================

-- Функция полнотекстового поиска материалов
CREATE OR REPLACE FUNCTION public.search_materials(search_term TEXT)
RETURNS TABLE(
  id UUID,
  name TEXT,
  description TEXT,
  material_type_code TEXT,
  applications TEXT[],
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mf.id,
    mf.name,
    mf.description,
    mf.material_type_code,
    mf.applications,
    ts_rank(m.search_vector, plainto_tsquery('english', search_term)) as rank
  FROM public.materials_full mf
  JOIN public.materials m ON mf.id = m.id
  WHERE m.search_vector @@ plainto_tsquery('english', search_term)
  ORDER BY rank DESC;
END;
$$ LANGUAGE plpgsql;

-- Функция поиска по диапазону плотности
CREATE OR REPLACE FUNCTION public.search_by_density(
  min_density NUMERIC DEFAULT NULL,
  max_density NUMERIC DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  name TEXT,
  density NUMERIC,
  material_type_code TEXT,
  units TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.name,
    m.density,
    m.material_type_code,
    m.units
  FROM public.materials m
  WHERE 
    (min_density IS NULL OR m.density >= min_density) AND
    (max_density IS NULL OR m.density <= max_density)
  ORDER BY m.density;
END;
$$ LANGUAGE plpgsql;

-- Функция поиска по множественным параметрам
CREATE OR REPLACE FUNCTION public.search_by_properties(
  min_density NUMERIC DEFAULT NULL,
  max_density NUMERIC DEFAULT NULL,
  min_youngs_modulus NUMERIC DEFAULT NULL,
  max_youngs_modulus NUMERIC DEFAULT NULL,
  material_type_filter TEXT DEFAULT NULL,
  application_filter TEXT DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  name TEXT,
  density NUMERIC,
  youngs_modulus NUMERIC,
  material_type_code TEXT,
  applications TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mf.id,
    mf.name,
    mf.density,
    mf.youngs_modulus,
    mf.material_type_code,
    mf.applications
  FROM public.materials_full mf
  WHERE 
    (min_density IS NULL OR mf.density >= min_density) AND
    (max_density IS NULL OR mf.density <= max_density) AND
    (min_youngs_modulus IS NULL OR mf.youngs_modulus >= min_youngs_modulus) AND
    (max_youngs_modulus IS NULL OR mf.youngs_modulus <= max_youngs_modulus) AND
    (material_type_filter IS NULL OR mf.material_type_code = material_type_filter) AND
    (application_filter IS NULL OR application_filter = ANY(mf.applications))
  ORDER BY mf.density, mf.youngs_modulus;
END;
$$ LANGUAGE plpgsql;

-- Функция для получения статистики базы данных
CREATE OR REPLACE FUNCTION public.get_database_stats()
RETURNS TABLE(
  materials_count BIGINT,
  references_count BIGINT,
  applications_count BIGINT,
  material_types_count BIGINT,
  curves_count BIGINT,
  avg_density NUMERIC,
  min_density NUMERIC,
  max_density NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM public.materials) as materials_count,
    (SELECT COUNT(*) FROM public.references) as references_count,
    (SELECT COUNT(*) FROM public.applications) as applications_count,
    (SELECT COUNT(*) FROM public.material_types) as material_types_count,
    (SELECT COUNT(*) FROM public.material_curves) as curves_count,
    (SELECT AVG(density) FROM public.materials WHERE density IS NOT NULL) as avg_density,
    (SELECT MIN(density) FROM public.materials WHERE density IS NOT NULL) as min_density,
    (SELECT MAX(density) FROM public.materials WHERE density IS NOT NULL) as max_density;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ТЕСТОВЫЕ ДАННЫЕ
-- ============================================

-- Добавляем базовые типы материалов
INSERT INTO public.material_types (name, description) VALUES
  ('Metal', 'Metallic materials including alloys'),
  ('Polymer', 'Polymer and plastic materials'),
  ('Composite', 'Composite materials'),
  ('Ceramic', 'Ceramic materials'),
  ('Biological', 'Biological and bio-inspired materials'),
  ('Ballistic', 'Materials for ballistic applications'),
  ('Foam', 'Foam materials'),
  ('Concrete', 'Concrete and cementitious materials'),
  ('Soil', 'Soil and geotechnical materials')
ON CONFLICT (name) DO NOTHING;

-- Добавляем базовые применения
INSERT INTO public.applications (name, description, category) VALUES
  ('Automotive crashworthiness', 'Vehicle crash simulation', 'industry'),
  ('Aerospace structures', 'Aircraft and spacecraft applications', 'industry'),
  ('Ballistic protection', 'Armor and protective systems', 'application'),
  ('Bird strike simulation', 'Analysis of bird impact on aircraft', 'application'),
  ('Impact simulation', 'General impact and crash analysis', 'simulation_type'),
  ('Structural analysis', 'Static and dynamic structural analysis', 'simulation_type'),
  ('Metal forming', 'Manufacturing process simulation', 'simulation_type'),
  ('Blast analysis', 'Explosion and blast simulation', 'application'),
  ('Penetration mechanics', 'Penetration and perforation analysis', 'application'),
  ('Civil engineering', 'Construction and infrastructure', 'industry')
ON CONFLICT (name) DO NOTHING;

-- Пример добавления материала (алюминий из db.toml)
DO $$
DECLARE
  material_uuid UUID;
  ref_uuid UUID;
  app_aluminum_uuid UUID;
  app_general_uuid UUID;
BEGIN
  -- Добавляем источник
  INSERT INTO public.references (title, authors, url) VALUES
    ('VarmintAl Material Library', 'VarmintAl', 'http://www.VarmintAl.com/aengr.htm')
  RETURNING id INTO ref_uuid;
  
  -- Добавляем применения если не существуют
  INSERT INTO public.applications (name, description, category) VALUES
    ('ALUMINUM PURE 99.996 ANNEALED', 'Pure aluminum 99.996% annealed', 'material_type'),
    ('General purpose aluminum alloy', 'General aluminum alloy applications', 'application')
  ON CONFLICT (name) DO NOTHING;
  
  -- Получаем UUID применений
  SELECT id INTO app_aluminum_uuid FROM public.applications WHERE name = 'ALUMINUM PURE 99.996 ANNEALED';
  SELECT id INTO app_general_uuid FROM public.applications WHERE name = 'General purpose aluminum alloy';
  
  -- Добавляем материал
  INSERT INTO public.materials (
    name, description, units, mat_data_raw, material_id, 
    material_type_code, density, youngs_modulus, poisson_ratio,
    source_file,
    mat_data_parsed
  ) VALUES (
    'ALUMINUM PURE 99.996 ANNEALED',
    'Pure aluminum 99.996% annealed from VarmintAl library',
    'mm–s–tonne–N–MPa',
    '*MAT_PIECEWISE_LINEAR_PLASTICITY_TITLE
ALUMINUM PURE 99.996 ANNEALED
$--------1---------2---------3---------4---------5---------6---------7---------8
$#     mid        ro         e        pr      sigy      etan      fail      tdel
        24  2.6849E9  6.8948E4     0.330    3.5309  0.000000  0.487600       0.0',
    24,
    'MAT_PIECEWISE_LINEAR_PLASTICITY',
    2.6849E9,
    6.8948E4,
    0.330,
    'db.toml',
    '{"mid": 24, "ro": 2.6849E9, "e": 6.8948E4, "pr": 0.330, "sigy": 3.5309}'::jsonb
  ) RETURNING id INTO material_uuid;
  
  -- Связываем материал с применениями
  INSERT INTO public.material_applications (material_id, application_id) VALUES
    (material_uuid, app_aluminum_uuid),
    (material_uuid, app_general_uuid);
  
  -- Связываем материал с источником
  INSERT INTO public.material_references (material_id, reference_id) VALUES
    (material_uuid, ref_uuid);
    
END $$;

-- ============================================
-- КОММЕНТАРИИ И ДОКУМЕНТАЦИЯ
-- ============================================

COMMENT ON TABLE public.materials IS 'Основная таблица материалов с данными LS-DYNA';
COMMENT ON COLUMN public.materials.mat_data_raw IS 'Исходный текст LS-DYNA материала';
COMMENT ON COLUMN public.materials.mat_data_parsed IS 'Парсированные параметры материала в формате JSON';
COMMENT ON COLUMN public.materials.material_id IS 'Material ID (MID) из LS-DYNA карты';
COMMENT ON COLUMN public.materials.material_type_code IS 'Тип материала (например, MAT_ELASTIC)';

COMMENT ON VIEW public.materials_full IS 'Полное представление материала с агрегированными данными о применениях и источниках';
COMMENT ON FUNCTION public.search_materials(TEXT) IS 'Полнотекстовый поиск материалов с ранжированием результатов';
COMMENT ON FUNCTION public.search_by_properties IS 'Поиск материалов по диапазону физических свойств';