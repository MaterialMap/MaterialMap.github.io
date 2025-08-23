#!/usr/bin/env node

/**
 * Скрипт импорта данных Material MAP в Supabase
 * 
 * Парсит TOML файлы из папки data/ и импортирует их в базу данных Supabase
 * Использование: node scripts/import-to-supabase.js [--dry-run] [--file=filename.toml]
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Импортируем TOML парсер
const TOML = require('smol-toml');

// Конфигурация Supabase (из переменных окружения)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Используем service role для записи
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Путь к данным
const DATA_DIR = path.join(__dirname, '..', 'data');

// Парсинг аргументов командной строки
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const fileFilter = args.find(arg => arg.startsWith('--file='))?.replace('--file=', '');

/**
 * Извлекает параметры из LS-DYNA карты материала
 * @param {string} matData - Строка с данными материала
 * @returns {object} - Объект с извлечёнными параметрами
 */
function parseMatData(matData) {
  if (!matData) return {};
  
  // Извлекаем тип материала из первой строки
  const typeMatch = matData.match(/\*MAT_([A-Z_]+)/);
  const materialType = typeMatch ? `MAT_${typeMatch[1]}` : null;
  
  // Извлекаем название материала
  const lines = matData.split('\n');
  let materialName = null;
  for (const line of lines) {
    if (!line.startsWith('*') && !line.startsWith('$') && !line.startsWith(' ') && line.trim()) {
      materialName = line.trim();
      break;
    }
  }
  
  // Извлекаем численные параметры (упрощённая версия)
  const params = {};
  
  // Ищем строки с данными (не комментарии и не заголовки)
  const dataLines = lines.filter(line => 
    line.trim() && 
    !line.startsWith('*') && 
    !line.startsWith('$') &&
    /[\d\.-]/.test(line) // содержит цифры
  );
  
  if (dataLines.length > 0) {
    // Парсим первую строку данных (обычно там основные параметры)
    const firstDataLine = dataLines[0];
    const values = firstDataLine.trim().split(/\s+/);
    
    // Стандартные позиции параметров в LS-DYNA (приблизительно)
    if (values.length >= 2) {
      params.mid = parseInt(values[0]) || null;
      params.ro = parseFloat(values[1]) || null; // плотность
    }
    if (values.length >= 3) {
      params.e = parseFloat(values[2]) || null; // модуль Юнга
    }
    if (values.length >= 4) {
      params.pr = parseFloat(values[3]) || null; // коэффициент Пуассона
    }
    if (values.length >= 5) {
      params.sigy = parseFloat(values[4]) || null; // предел текучести
    }
  }
  
  return {
    type: materialType,
    name: materialName,
    ...params
  };
}

/**
 * Извлекает кривые из данных EOS или материала
 * @param {string} data - Строка с данными
 * @returns {Array} - Массив кривых
 */
function extractCurves(data) {
  if (!data) return [];
  
  const curves = [];
  const lines = data.split('\n');
  
  let currentCurve = null;
  let inCurveData = false;
  
  for (const line of lines) {
    // Ищем определение кривой
    if (line.includes('*DEFINE_CURVE')) {
      currentCurve = {
        type: 'DEFINE_CURVE',
        id: null,
        name: null,
        points: []
      };
      inCurveData = false;
      continue;
    }
    
    // Название кривой
    if (currentCurve && !line.startsWith('$') && !line.startsWith('*') && 
        !inCurveData && line.trim() && !(/^\s*\d/.test(line))) {
      currentCurve.name = line.trim();
      continue;
    }
    
    // Параметры кривой
    if (currentCurve && line.includes('lcid')) {
      const values = line.trim().split(/\s+/);
      currentCurve.id = parseInt(values[0]) || null;
      inCurveData = true;
      continue;
    }
    
    // Точки кривой
    if (currentCurve && inCurveData && line.trim() && 
        !line.startsWith('$') && !line.startsWith('*')) {
      const values = line.trim().split(/\s+/);
      if (values.length >= 2) {
        const x = parseFloat(values[0]);
        const y = parseFloat(values[1]);
        if (!isNaN(x) && !isNaN(y)) {
          currentCurve.points.push({ x, y });
        }
      }
    }
    
    // Конец данных кривой
    if (line.includes('$--------') && currentCurve && currentCurve.points.length > 0) {
      curves.push(currentCurve);
      currentCurve = null;
      inCurveData = false;
    }
  }
  
  return curves;
}

/**
 * Обрабатывает один TOML файл
 * @param {string} filePath - Путь к файлу
 * @returns {Array} - Массив обработанных материалов
 */
function processTomlFile(filePath) {
  console.log(`Обработка файла: ${path.basename(filePath)}`);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = TOML.parse(content);
    
    if (!data.material || !Array.isArray(data.material)) {
      console.warn(`Файл ${filePath} не содержит массив материалов`);
      return [];
    }
    
    const processedMaterials = [];
    
    for (const material of data.material) {
      // Валидация обязательных полей
      if (!material.mat_data || !material.app || !material.url) {
        console.warn('Пропуск материала: отсутствуют обязательные поля');
        continue;
      }
      
      // Парсим данные материала
      const matDataParsed = parseMatData(material.mat_data);
      
      const processedMaterial = {
        // Базовые данные
        name: matDataParsed.name || 'Unnamed Material',
        description: material.comments || null,
        units: material.units || 'mm–s–tonne–N–MPa',
        
        // Сырые данные LS-DYNA
        mat_data_raw: material.mat_data.trim(),
        eos_data_raw: material.eos_data?.trim() || null,
        mat_add_data_raw: material.mat_add_data?.trim() || null,
        mat_thermal_data_raw: material.mat_thermal_data?.trim() || null,
        
        // Парсированные данные
        mat_data_parsed: matDataParsed,
        eos_data_parsed: material.eos_data ? parseMatData(material.eos_data) : null,
        
        // Извлечённые параметры
        material_id: matDataParsed.mid,
        material_type_code: matDataParsed.type,
        density: matDataParsed.ro,
        youngs_modulus: matDataParsed.e,
        poisson_ratio: matDataParsed.pr,
        yield_strength: matDataParsed.sigy,
        
        // Метаданные
        comments: material.comments || null,
        source_file: path.basename(filePath),
        
        // Связанные данные
        applications: Array.isArray(material.app) ? material.app : [material.app],
        reference: {
          title: material.ref || `Material from ${path.basename(filePath)}`,
          url: material.url,
          authors: null,
          year: null
        },
        
        // Кривые
        curves: [
          ...extractCurves(material.mat_data),
          ...extractCurves(material.eos_data || '')
        ]
      };
      
      processedMaterials.push(processedMaterial);
    }
    
    console.log(`  Обработано материалов: ${processedMaterials.length}`);
    return processedMaterials;
    
  } catch (error) {
    console.error(`Ошибка обработки файла ${filePath}:`, error.message);
    return [];
  }
}

/**
 * Импортирует материал в Supabase
 * @param {object} material - Данные материала
 * @returns {string|null} - UUID созданного материала
 */
async function importMaterial(material) {
  try {
    // 1. Создаём или находим источник
    let referenceId;
    const { data: existingRef } = await supabase
      .from('references')
      .select('id')
      .eq('url', material.reference.url)
      .single();
    
    if (existingRef) {
      referenceId = existingRef.id;
    } else {
      const { data: newRef, error: refError } = await supabase
        .from('references')
        .insert({
          title: material.reference.title,
          url: material.reference.url,
          authors: material.reference.authors,
          year: material.reference.year
        })
        .select('id')
        .single();
      
      if (refError) throw refError;
      referenceId = newRef.id;
    }
    
    // 2. Создаём материал
    const { data: newMaterial, error: materialError } = await supabase
      .from('materials')
      .insert({
        name: material.name,
        description: material.description,
        units: material.units,
        mat_data_raw: material.mat_data_raw,
        mat_data_parsed: material.mat_data_parsed,
        eos_data_raw: material.eos_data_raw,
        eos_data_parsed: material.eos_data_parsed,
        mat_add_data_raw: material.mat_add_data_raw,
        mat_thermal_data_raw: material.mat_thermal_data_raw,
        material_id: material.material_id,
        material_type_code: material.material_type_code,
        density: material.density,
        youngs_modulus: material.youngs_modulus,
        poisson_ratio: material.poisson_ratio,
        yield_strength: material.yield_strength,
        comments: material.comments,
        source_file: material.source_file
      })
      .select('id')
      .single();
    
    if (materialError) throw materialError;
    const materialId = newMaterial.id;
    
    // 3. Создаём применения и связи
    for (const appName of material.applications) {
      // Создаём применение если не существует
      const { data: app } = await supabase
        .from('applications')
        .upsert({ name: appName }, { onConflict: 'name' })
        .select('id')
        .single();
      
      if (app) {
        // Создаём связь
        await supabase
          .from('material_applications')
          .insert({
            material_id: materialId,
            application_id: app.id
          });
      }
    }
    
    // 4. Создаём связь с источником
    await supabase
      .from('material_references')
      .insert({
        material_id: materialId,
        reference_id: referenceId
      });
    
    // 5. Создаём кривые
    for (const curve of material.curves) {
      await supabase
        .from('material_curves')
        .insert({
          material_id: materialId,
          curve_type: curve.type,
          curve_id: curve.id,
          curve_name: curve.name,
          data_points: curve.points,
          metadata: {
            points_count: curve.points.length
          }
        });
    }
    
    return materialId;
    
  } catch (error) {
    console.error('Ошибка импорта материала:', error.message);
    return null;
  }
}

/**
 * Главная функция
 */
async function main() {
  console.log('🚀 Импорт данных Material MAP в Supabase');
  console.log('=====================================');
  
  if (isDryRun) {
    console.log('🔍 Режим проверки (dry-run) - данные не будут импортированы\n');
  }
  
  // Проверяем переменные окружения
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Ошибка: Не заданы переменные окружения SUPABASE_URL и/или SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
  
  // Получаем список TOML файлов
  let tomlFiles;
  try {
    const allFiles = fs.readdirSync(DATA_DIR);
    tomlFiles = allFiles
      .filter(file => file.endsWith('.toml'))
      .filter(file => !fileFilter || file === fileFilter)
      .map(file => path.join(DATA_DIR, file));
  } catch (error) {
    console.error(`❌ Ошибка чтения директории ${DATA_DIR}:`, error.message);
    process.exit(1);
  }
  
  console.log(`📁 Найдено TOML файлов: ${tomlFiles.length}\n`);
  
  let totalMaterials = 0;
  let importedMaterials = 0;
  
  // Обрабатываем каждый файл
  for (const filePath of tomlFiles) {
    const materials = processTomlFile(filePath);
    totalMaterials += materials.length;
    
    if (isDryRun) {
      console.log(`  [DRY-RUN] Будет импортировано: ${materials.length} материалов`);
      continue;
    }
    
    // Импортируем материалы
    for (const material of materials) {
      const materialId = await importMaterial(material);
      if (materialId) {
        importedMaterials++;
        console.log(`  ✅ Импортирован: ${material.name} (ID: ${materialId})`);
      } else {
        console.log(`  ❌ Ошибка импорта: ${material.name}`);
      }
    }
  }
  
  console.log('\n📊 Статистика импорта:');
  console.log(`   Обработано файлов: ${tomlFiles.length}`);
  console.log(`   Найдено материалов: ${totalMaterials}`);
  console.log(`   Импортировано материалов: ${importedMaterials}`);
  
  if (isDryRun) {
    console.log('\n💡 Для выполнения импорта запустите без флага --dry-run');
  }
}

// Запуск
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Критическая ошибка:', error.message);
    process.exit(1);
  });
}

module.exports = {
  processTomlFile,
  parseMatData,
  extractCurves,
  importMaterial
};