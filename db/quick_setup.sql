-- ============================================
-- БЫСТРАЯ НАСТРОЙКА MATERIAL MAP в SUPABASE  
-- ============================================

-- Включаем расширения
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Таблица источников
CREATE TABLE IF NOT EXISTS public.references (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  authors TEXT,
  year INTEGER,
  url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица применений
CREATE TABLE IF NOT EXISTS public.applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Основная таблица материалов
CREATE TABLE IF NOT EXISTS public.materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  units TEXT NOT NULL DEFAULT 'mm–s–tonne–N–MPa',
  
  -- LS-DYNA данные
  mat_data_raw TEXT NOT NULL,
  mat_data_parsed JSONB DEFAULT '{}',
  eos_data_raw TEXT,
  
  -- Параметры для поиска
  material_type_code TEXT,
  density NUMERIC,
  youngs_modulus NUMERIC,
  poisson_ratio NUMERIC,
  yield_strength NUMERIC,
  
  comments TEXT,
  source_file TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Связующие таблицы
CREATE TABLE IF NOT EXISTS public.material_applications (
  material_id UUID REFERENCES public.materials(id) ON DELETE CASCADE,
  application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
  PRIMARY KEY (material_id, application_id)
);

CREATE TABLE IF NOT EXISTS public.material_references (
  material_id UUID REFERENCES public.materials(id) ON DELETE CASCADE,
  reference_id UUID REFERENCES public.references(id) ON DELETE CASCADE,
  PRIMARY KEY (material_id, reference_id)
);

-- Кривые
CREATE TABLE IF NOT EXISTS public.material_curves (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  material_id UUID REFERENCES public.materials(id) ON DELETE CASCADE,
  curve_type TEXT NOT NULL,
  curve_id INTEGER,
  curve_name TEXT,
  data_points JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Основные индексы
CREATE INDEX IF NOT EXISTS idx_materials_density ON public.materials (density);
CREATE INDEX IF NOT EXISTS idx_materials_type ON public.materials (material_type_code);
CREATE INDEX IF NOT EXISTS idx_materials_name ON public.materials USING GIN (name gin_trgm_ops);

-- RLS политики (публичное чтение)
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.references ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_curves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_references ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON public.materials FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.applications FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.references FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.material_curves FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.material_applications FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.material_references FOR SELECT USING (true);

-- Представление с агрегированными данными
CREATE VIEW IF NOT EXISTS public.materials_full AS
SELECT 
  m.id, m.name, m.description, m.units,
  m.mat_data_raw, m.eos_data_raw,
  m.material_type_code, m.density, m.youngs_modulus, 
  m.poisson_ratio, m.yield_strength,
  m.comments, m.source_file, m.created_at,
  
  COALESCE(
    ARRAY_AGG(DISTINCT a.name ORDER BY a.name) FILTER (WHERE a.name IS NOT NULL), 
    ARRAY[]::TEXT[]
  ) as applications,
  
  COALESCE(
    ARRAY_AGG(DISTINCT r.url ORDER BY r.url) FILTER (WHERE r.url IS NOT NULL), 
    ARRAY[]::TEXT[]
  ) as reference_urls
  
FROM public.materials m
LEFT JOIN public.material_applications ma ON m.id = ma.material_id
LEFT JOIN public.applications a ON ma.application_id = a.id
LEFT JOIN public.material_references mr ON m.id = mr.material_id
LEFT JOIN public.references r ON mr.reference_id = r.id
GROUP BY m.id, m.name, m.description, m.units, m.mat_data_raw, m.eos_data_raw,
         m.material_type_code, m.density, m.youngs_modulus, 
         m.poisson_ratio, m.yield_strength, m.comments, m.source_file, m.created_at;