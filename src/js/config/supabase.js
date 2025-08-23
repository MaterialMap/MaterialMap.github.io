/**
 * Конфигурация Supabase для Material MAP
 */

// Импортируем Supabase клиент
import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js@2';

// Конфигурация (в продакшене использовать переменные окружения)
const SUPABASE_CONFIG = {
  url: process.env.SUPABASE_URL || 'https://your-project-ref.supabase.co',
  anonKey: process.env.SUPABASE_ANON_KEY || 'your-anon-key',
  
  // Опции клиента
  options: {
    auth: {
      persistSession: false // Для статического сайта
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'X-Client-Info': 'materialmap-web@1.0.0'
      }
    }
  }
};

// Создаём клиент Supabase
const supabase = createClient(
  SUPABASE_CONFIG.url,
  SUPABASE_CONFIG.anonKey,
  SUPABASE_CONFIG.options
);

/**
 * API класс для работы с материалами
 */
class MaterialsAPI {
  
  /**
   * Получить материалы с пагинацией и фильтрацией
   * @param {Object} options - Опции запроса
   * @param {number} options.page - Номер страницы (начиная с 0)
   * @param {number} options.limit - Количество записей на странице
   * @param {string} options.search - Поисковый запрос
   * @param {string} options.materialType - Фильтр по типу материала
   * @param {Object} options.densityRange - Диапазон плотности {min, max}
   * @param {Array} options.applications - Фильтр по применениям
   * @param {string} options.sortBy - Поле для сортировки
   * @param {boolean} options.sortAsc - Направление сортировки (true = ASC)
   * @returns {Promise<Object>} Результат запроса
   */
  async getMaterials(options = {}) {
    const {
      page = 0,
      limit = 50,
      search = '',
      materialType = '',
      densityRange = {},
      applications = [],
      sortBy = 'name',
      sortAsc = true
    } = options;
    
    try {
      let query = supabase
        .from('materials_full')
        .select(`
          id,
          name,
          description,
          material_type_code,
          density,
          youngs_modulus,
          poisson_ratio,
          yield_strength,
          units,
          applications,
          reference_urls,
          created_at
        `, { count: 'exact' });
      
      // Поиск по тексту
      if (search.trim()) {
        // Используем RPC функцию для полнотекстового поиска
        const searchResults = await supabase
          .rpc('search_materials', { search_term: search.trim() });
        
        if (searchResults.data && searchResults.data.length > 0) {
          const materialIds = searchResults.data.map(item => item.id);
          query = query.in('id', materialIds);
        } else {
          // Если полнотекстовый поиск не дал результатов, ищем по названию
          query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
        }
      }
      
      // Фильтр по типу материала
      if (materialType) {
        query = query.eq('material_type_code', materialType);
      }
      
      // Фильтр по плотности
      if (densityRange.min !== undefined) {
        query = query.gte('density', densityRange.min);
      }
      if (densityRange.max !== undefined) {
        query = query.lte('density', densityRange.max);
      }
      
      // Фильтр по применениям
      if (applications.length > 0) {
        query = query.overlaps('applications', applications);
      }
      
      // Сортировка
      query = query.order(sortBy, { ascending: sortAsc });
      
      // Пагинация
      const startRange = page * limit;
      const endRange = startRange + limit - 1;
      query = query.range(startRange, endRange);
      
      const { data, error, count } = await query;
      
      if (error) throw error;
      
      return {
        data: data || [],
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
        hasMore: (count || 0) > endRange + 1
      };
      
    } catch (error) {
      console.error('Ошибка получения материалов:', error);
      throw new Error(`Не удалось загрузить материалы: ${error.message}`);
    }
  }
  
  /**
   * Получить один материал по ID
   * @param {string} id - UUID материала
   * @returns {Promise<Object>} Материал
   */
  async getMaterial(id) {
    try {
      const { data, error } = await supabase
        .from('materials_full')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
      
    } catch (error) {
      console.error('Ошибка получения материала:', error);
      throw new Error(`Не удалось загрузить материал: ${error.message}`);
    }
  }
  
  /**
   * Получить кривые для материала
   * @param {string} materialId - UUID материала
   * @returns {Promise<Array>} Массив кривых
   */
  async getMaterialCurves(materialId) {
    try {
      const { data, error } = await supabase
        .from('material_curves')
        .select('*')
        .eq('material_id', materialId)
        .order('curve_type, curve_id');
      
      if (error) throw error;
      return data || [];
      
    } catch (error) {
      console.error('Ошибка получения кривых:', error);
      throw new Error(`Не удалось загрузить кривые: ${error.message}`);
    }
  }
  
  /**
   * Получить список всех применений
   * @returns {Promise<Array>} Массив применений
   */
  async getApplications() {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('id, name, description, category')
        .order('category, name');
      
      if (error) throw error;
      return data || [];
      
    } catch (error) {
      console.error('Ошибка получения применений:', error);
      return [];
    }
  }
  
  /**
   * Получить список всех типов материалов
   * @returns {Promise<Array>} Массив типов
   */
  async getMaterialTypes() {
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('material_type_code')
        .not('material_type_code', 'is', null)
        .order('material_type_code');
      
      if (error) throw error;
      
      // Убираем дубликаты
      const uniqueTypes = [...new Set(data.map(item => item.material_type_code))];
      return uniqueTypes;
      
    } catch (error) {
      console.error('Ошибка получения типов материалов:', error);
      return [];
    }
  }
  
  /**
   * Получить статистику базы данных
   * @returns {Promise<Object>} Статистика
   */
  async getStats() {
    try {
      const { data, error } = await supabase
        .rpc('get_database_stats');
      
      if (error) throw error;
      return data[0] || {};
      
    } catch (error) {
      console.error('Ошибка получения статистики:', error);
      return {};
    }
  }
  
  /**
   * Продвинутый поиск по параметрам
   * @param {Object} filters - Фильтры поиска
   * @returns {Promise<Array>} Результаты поиска
   */
  async advancedSearch(filters = {}) {
    const {
      minDensity,
      maxDensity,
      minYoungsModulus,
      maxYoungsModulus,
      materialType,
      application
    } = filters;
    
    try {
      const { data, error } = await supabase
        .rpc('search_by_properties', {
          min_density: minDensity || null,
          max_density: maxDensity || null,
          min_youngs_modulus: minYoungsModulus || null,
          max_youngs_modulus: maxYoungsModulus || null,
          material_type_filter: materialType || null,
          application_filter: application || null
        });
      
      if (error) throw error;
      return data || [];
      
    } catch (error) {
      console.error('Ошибка продвинутого поиска:', error);
      return [];
    }
  }
  
  /**
   * Экспорт данных материала в LS-DYNA формат
   * @param {string} materialId - UUID материала
   * @returns {Promise<string>} LS-DYNA текст
   */
  async exportMaterial(materialId) {
    try {
      const material = await this.getMaterial(materialId);
      
      let output = '';
      
      // Основные данные материала
      if (material.mat_data_raw) {
        output += material.mat_data_raw + '\n';
      }
      
      // EOS данные
      if (material.eos_data_raw) {
        output += material.eos_data_raw + '\n';
      }
      
      // Дополнительные данные
      if (material.mat_add_data_raw) {
        output += material.mat_add_data_raw + '\n';
      }
      
      // Термические данные
      if (material.mat_thermal_data_raw) {
        output += material.mat_thermal_data_raw + '\n';
      }
      
      return output.trim();
      
    } catch (error) {
      console.error('Ошибка экспорта материала:', error);
      throw new Error(`Не удалось экспортировать материал: ${error.message}`);
    }
  }
}

// Создаём экземпляр API
const materialsAPI = new MaterialsAPI();

// Экспортируем для использования в других модулях
export { supabase, materialsAPI, SUPABASE_CONFIG };

// Для совместимости с CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { supabase, materialsAPI, SUPABASE_CONFIG };
}