# 🎮 Интерактивный пример работы с БД Material MAP

## 🎯 Давайте разберем на реальных данных!

### 📦 У нас есть материал "ALUMINUM PURE 99.996 ANNEALED"

Посмотрим как он хранится и связан с другими данными:

## 🗂️ Таблица `materials`
```sql
SELECT id, name, density, youngs_modulus, material_type_code 
FROM materials 
WHERE name = 'ALUMINUM PURE 99.996 ANNEALED';
```

**Результат:**
```
┌────┬──────────────────────────────┬─────────────┬────────────────┬─────────────────────────────┐
│ id │ name                         │ density     │ youngs_modulus │ material_type_code          │
├────┼──────────────────────────────┼─────────────┼────────────────┼─────────────────────────────┤
│ 1  │ ALUMINUM PURE 99.996 ANNEALED│ 2684900000  │ 68948          │ MAT_PIECEWISE_LINEAR_PLAS.. │
└────┴──────────────────────────────┴─────────────┴────────────────┴─────────────────────────────┘
```

## 🔍 Что означают эти цифры?

### Плотность: `2684900000`
- **В каких единицах?** Посмотрим столбец `units`: "mm–s–tonne–N–MPa"  
- **Что это значит?** 2,684,900,000 тонн/м³ = 2.68 г/см³
- **Это нормально?** Да! Обычный алюминий весит ~2.7 г/см³

### Модуль Юнга: `68948`
- **В единицах:** МПа (мегапаскали)
- **Что это значит?** 68,948 МПа ≈ 69 ГПа
- **Это нормально?** Да! У алюминия модуль Юнга ~70 ГПа

## 🏷️ Какие применения у этого материала?

```sql
SELECT a.name, a.category 
FROM applications a
JOIN material_applications ma ON a.id = ma.application_id  
WHERE ma.material_id = 1;
```

**Результат:**
```
┌─────────────────────────┬─────────────────┐
│ name                    │ category        │
├─────────────────────────┼─────────────────┤
│ Automotive crashworth.. │ industry        │
│ Aerospace structures    │ industry        │
│ Ballistic protection    │ application     │
│ Bird strike simulation  │ application     │
│ Impact simulation       │ simulation_type │
│ Structural analysis     │ simulation_type │
│ Metal forming           │ simulation_type │
│ Blast analysis          │ application     │
│ Penetration mechanics   │ application     │
│ Civil engineering       │ industry        │
│ Marine applications     │ industry        │
│ General purpose alumi.. │ application     │
└─────────────────────────┴─────────────────┘
```

## 📚 Откуда взяли данные?

```sql
SELECT r.title, r.url, r.year
FROM references r
JOIN material_references mr ON r.id = mr.reference_id
WHERE mr.material_id = 1;
```

**Результат:**
```
┌─────────────────────────────┬─────────────────────────────┬──────┐
│ title                       │ url                         │ year │
├─────────────────────────────┼─────────────────────────────┼──────┤
│ VarmintAl Engineering Props │ http://www.VarmintAl.com/.. │ NULL │
└─────────────────────────────┴─────────────────────────────┴──────┘
```

## 🎨 Полная картина через представление

```sql
SELECT name, density, applications, reference_urls
FROM materials_full 
WHERE name = 'ALUMINUM PURE 99.996 ANNEALED';
```

**Результат:**
```
┌──────────────────────────────┬─────────────┬──────────────────────┬─────────────────────────────┐
│ name                         │ density     │ applications         │ reference_urls              │
├──────────────────────────────┼─────────────┼──────────────────────┼─────────────────────────────┤
│ ALUMINUM PURE 99.996 ANNEALED│ 2684900000  │ [Automotive, Aero..] │ [http://www.VarmintAl.com..]│
└──────────────────────────────┴─────────────┴──────────────────────┴─────────────────────────────┘
```

## 🔎 Тестируем поиск

### 1. Текстовый поиск "aluminum"
```sql
SELECT name, rank FROM search_materials('aluminum');
```

**Результат:**
```
┌──────────────────────────────┬──────────┐
│ name                         │ rank     │
├──────────────────────────────┼──────────┤
│ ALUMINUM PURE 99.996 ANNEALED│ 0.075991 │
└──────────────────────────────┴──────────┘
```
✅ **Найден!** Ранг 0.076 означает хорошее совпадение.

### 2. Поиск по плотности "легкие металлы" (2-3 г/см³)
```sql
SELECT name, density FROM search_by_density(2000000000, 3000000000);
```

**Результат:**
```
┌──────────────────────────────┬─────────────┐
│ name                         │ density     │
├──────────────────────────────┼─────────────┤
│ ALUMINUM PURE 99.996 ANNEALED│ 2684900000  │
└──────────────────────────────┴─────────────┘
```
✅ **Найден!** 2.68 г/см³ попадает в диапазон 2-3 г/см³.

### 3. Поиск по модулю Юнга (50-80 ГПа)
```sql
SELECT name, youngs_modulus 
FROM search_by_properties(50000, 80000, 'youngs_modulus');
```

**Результат:**
```
┌──────────────────────────────┬────────────────┐
│ name                         │ youngs_modulus │
├──────────────────────────────┼────────────────┤
│ ALUMINUM PURE 99.996 ANNEALED│ 68948          │
└──────────────────────────────┴────────────────┘
```
✅ **Найден!** 68,948 МПа попадает в диапазон 50-80 ГПа.

## 🎭 Симуляция пользовательского запроса

### Сценарий: "Инженер ищет материал для кузова автомобиля"

**Требования:**
- Легкий (плотность < 5 г/см³)
- Прочный (модуль Юнга > 50 ГПа)  
- Для автопрома

**SQL запрос:**
```sql
WITH automotive_materials AS (
  SELECT m.* FROM materials m
  JOIN material_applications ma ON m.id = ma.material_id
  JOIN applications a ON ma.application_id = a.id
  WHERE a.name LIKE '%Automotive%'
),
light_strong_materials AS (
  SELECT * FROM automotive_materials
  WHERE density < 5000000000  -- < 5 г/см³
    AND youngs_modulus > 50000 -- > 50 ГПа
)
SELECT 
  name,
  ROUND(density::numeric / 1000000000, 2) as "density_g_cm3",
  ROUND(youngs_modulus::numeric / 1000, 0) as "modulus_GPa",
  units
FROM light_strong_materials;
```

**Результат:**
```
┌──────────────────────────────┬─────────────────┬─────────────┬───────────────────┐
│ name                         │ density_g_cm3   │ modulus_GPa │ units             │
├──────────────────────────────┼─────────────────┼─────────────┼───────────────────┤
│ ALUMINUM PURE 99.996 ANNEALED│ 2.68            │ 69          │ mm–s–tonne–N–MPa  │
└──────────────────────────────┴─────────────────┴─────────────┴───────────────────┘
```

✅ **Идеально подходит!** Легкий (2.68 г/см³) и прочный (69 ГПа) материал для автопрома.

## 🧩 Как это работает в коде JavaScript

### API запрос из фронтенда:
```javascript
// Поиск материалов для автопрома
const { data } = await supabase
  .from('materials_full')
  .select('*')
  .contains('applications', ['Automotive crashworthiness'])
  .lt('density', 5000000000)
  .gt('youngs_modulus', 50000);

console.log(data);
// [{ name: "ALUMINUM PURE 99.996 ANNEALED", density: 2684900000, ... }]
```

### Использование функций поиска:
```javascript
// Текстовый поиск
const { data: searchResults } = await supabase
  .rpc('search_materials', { search_query: 'aluminum automotive' });

// Поиск по плотности  
const { data: lightMaterials } = await supabase
  .rpc('search_by_density', { 
    min_density: 2000000000, 
    max_density: 3000000000 
  });
```

## 🎯 Резюме: Почему это работает?

### 1. **Нормализованная структура**
- Материалы отделены от применений
- Источники отделены от материалов
- Нет дублирования данных

### 2. **Умные связи**  
- Many-to-many позволяет гибко связывать данные
- Один материал → много применений
- Одно применение → много материалов

### 3. **Производительные индексы**
- Быстрый поиск по плотности  
- Быстрый полнотекстовый поиск
- Быстрые JOIN операции

### 4. **Удобные представления**
- materials_full собирает все связанные данные
- Не нужно писать сложные JOIN каждый раз

### 5. **Готовые функции поиска**
- search_materials() для текстового поиска
- search_by_density() для поиска по диапазонам
- Возвращают отсортированные результаты

Вот так простая структура базы данных превращается в мощный инструмент для поиска и анализа материалов! 🚀

## 📝 Попробуйте сами!

Откройте `supabase-demo.html` в браузере и поэкспериментируйте с поиском:
- Попробуйте найти "aluminum"  
- Поищите материалы с плотностью 2000-3000
- Посмотрите на полную информацию о материалах

Каждый клик в интерфейсе = SQL запрос к базе данных! 🎮