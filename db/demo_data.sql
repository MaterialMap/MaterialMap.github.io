-- ============================================
-- ДЕМОНСТРАЦИОННЫЕ ДАННЫЕ ДЛЯ MATERIAL MAP
-- ============================================

-- Добавляем источники
INSERT INTO public.references (title, authors, year, url) VALUES
('Material Properties of Steel', 'Johnson, A.', 2020, 'https://example.com/steel-properties'),
('Aluminum Alloy Research', 'Smith, B.', 2021, 'https://example.com/aluminum-study'),
('Advanced Composites', 'Brown, C.', 2022, 'https://example.com/composites');

-- Добавляем применения
INSERT INTO public.applications (name, description, category) VALUES
('Automotive crash testing', 'Crash simulation applications', 'industry'),
('Ballistic protection', 'Ballistic impact simulation', 'simulation_type'),
('Steel structures', 'Structural analysis', 'material_type'),
('Aluminum components', 'Lightweight parts', 'material_type'),
('Aerospace applications', 'Aerospace industry', 'industry');

-- Добавляем демонстрационные материалы
WITH ref_ids AS (
  SELECT id as ref_id, title FROM public.references
), app_ids AS (
  SELECT id as app_id, name FROM public.applications
)
INSERT INTO public.materials (
  name, description, units, mat_data_raw, 
  material_type_code, density, youngs_modulus, 
  poisson_ratio, yield_strength, comments, source_file
) VALUES
(
  'Steel AISI 1006',
  'Low carbon steel for automotive applications',
  'mm-ms-tonne-N-MPa',
  '*MAT_PLASTIC_KINEMATIC_TITLE
Steel AISI 1006
$#     MID        RO         E        PR      SIGY
         1   7.85e-6    200000      0.29       240
$#    ETAN      BETA      SRC       SRP      SRFT
         0         0        1         1         1',
  'MAT_PLASTIC_KINEMATIC',
  7.85e-6,
  200000,
  0.29,
  240,
  'Validated for crash testing applications',
  'demo_steel.toml'
),
(
  'Aluminum 6061-T6',
  'Heat treated aluminum alloy',
  'mm-ms-tonne-N-MPa',
  '*MAT_PLASTIC_KINEMATIC_TITLE
Aluminum 6061-T6
$#     MID        RO         E        PR      SIGY
         2   2.70e-6     69000      0.33       276
$#    ETAN      BETA      SRC       SRP      SRFT
       500         0        1         1         1',
  'MAT_PLASTIC_KINEMATIC',
  2.70e-6,
  69000,
  0.33,
  276,
  'High strength aluminum alloy for aerospace',
  'demo_aluminum.toml'
),
(
  'Elastic Steel Generic',
  'Generic elastic steel model',
  'mm-ms-tonne-N-MPa',
  '*MAT_ELASTIC_TITLE
Elastic Steel
$#     MID        RO         E        PR
         3   7.85e-6    210000      0.30',
  'MAT_ELASTIC',
  7.85e-6,
  210000,
  0.30,
  NULL,
  'Simple elastic model for preliminary analysis',
  'demo_elastic.toml'
);

-- Создаем связи между материалами и применениями
WITH material_data AS (
  SELECT 
    m.id as material_id,
    m.name as material_name,
    a.id as application_id,
    a.name as application_name
  FROM public.materials m, public.applications a
)
INSERT INTO public.material_applications (material_id, application_id)
SELECT material_id, application_id FROM material_data
WHERE 
  -- Steel AISI 1006 используется в автомобильных краш-тестах и стальных конструкциях
  (material_name = 'Steel AISI 1006' AND application_name IN ('Automotive crash testing', 'Steel structures'))
  OR
  -- Aluminum используется в аэрокосмической промышленности
  (material_name = 'Aluminum 6061-T6' AND application_name IN ('Aerospace applications', 'Aluminum components'))
  OR
  -- Elastic steel для общих структурных применений
  (material_name = 'Elastic Steel Generic' AND application_name = 'Steel structures');

-- Создаем связи между материалами и источниками  
WITH material_ref_data AS (
  SELECT 
    m.id as material_id,
    m.name as material_name,
    r.id as reference_id,
    r.title as reference_title
  FROM public.materials m, public.references r
)
INSERT INTO public.material_references (material_id, reference_id)
SELECT material_id, reference_id FROM material_ref_data
WHERE 
  -- Steel материалы связываем с исследованием стали
  (material_name LIKE '%Steel%' AND reference_title = 'Material Properties of Steel')
  OR
  -- Aluminum материал связываем с исследованием алюминия
  (material_name LIKE '%Aluminum%' AND reference_title = 'Aluminum Alloy Research');

-- Добавляем пример кривой для алюминия
INSERT INTO public.material_curves (material_id, curve_type, curve_id, curve_name, data_points)
SELECT 
  m.id,
  'DEFINE_CURVE',
  100,
  'Stress-Strain Curve for Al 6061-T6',
  '[
    {"x": 0, "y": 0},
    {"x": 0.001, "y": 69},
    {"x": 0.004, "y": 276},
    {"x": 0.1, "y": 310},
    {"x": 0.17, "y": 310}
  ]'::jsonb
FROM public.materials m
WHERE m.name = 'Aluminum 6061-T6';

-- Проверочные запросы
-- SELECT * FROM public.materials_full;
-- SELECT count(*) as materials_count FROM public.materials;
-- SELECT count(*) as applications_count FROM public.applications;
-- SELECT count(*) as references_count FROM public.references;