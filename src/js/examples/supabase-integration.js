/**
 * Примеры интеграции Supabase API в Material MAP
 * Демонстрирует как заменить существующую логику на работу с базой данных
 */

import { materialsAPI } from '../config/supabase.js';

/**
 * Пример 1: Замена загрузки TOML файлов на загрузку из БД
 * Адаптер для совместимости с существующим кодом
 */
class SupabaseMaterialLoader {
  constructor() {
    this.cache = new Map();
    this.loaded = false;
  }
  
  /**
   * Загружает все материалы из БД (аналог loadMaterials из MaterialApp.js)
   * @param {Object} options - Опции загрузки
   * @returns {Promise<Array>} Массив материалов в формате как из TOML
   */
  async loadMaterials(options = {}) {
    if (this.loaded && !options.forceReload) {
      return Array.from(this.cache.values());
    }
    
    try {
      console.log('Загрузка материалов из Supabase...');
      
      // Загружаем все материалы (можно добавить пагинацию)
      const result = await materialsAPI.getMaterials({
        limit: 1000, // Загружаем больше данных за раз
        ...options
      });
      
      // Конвертируем в формат совместимый с существующим кодом
      const materials = result.data.map(this.convertToTomlFormat);
      
      // Кешируем результат
      this.cache.clear();
      materials.forEach(material => {
        this.cache.set(material.id, material);
      });
      
      this.loaded = true;
      console.log(`Загружено ${materials.length} материалов из Supabase`);
      
      return materials;
      
    } catch (error) {
      console.error('Ошибка загрузки материалов:', error);
      // Fallback на пустой массив
      return [];
    }
  }
  
  /**
   * Преобразует материал из БД в формат аналогичный TOML
   * @param {Object} dbMaterial - Материал из БД
   * @returns {Object} Материал в TOML-подобном формате
   */
  convertToTomlFormat(dbMaterial) {
    return {
      // Базовые поля
      id: dbMaterial.id,
      name: dbMaterial.name,
      description: dbMaterial.description,
      units: dbMaterial.units,
      
      // LS-DYNA данные
      mat_data: dbMaterial.mat_data_raw,
      eos_data: dbMaterial.eos_data_raw,
      mat_add_data: dbMaterial.mat_add_data_raw,
      mat_thermal_data: dbMaterial.mat_thermal_data_raw,
      
      // Парсированные данные для поиска
      material_id: dbMaterial.material_id,
      material_type: dbMaterial.material_type_code,
      density: dbMaterial.density,
      youngs_modulus: dbMaterial.youngs_modulus,
      poisson_ratio: dbMaterial.poisson_ratio,
      yield_strength: dbMaterial.yield_strength,
      
      // Применения и источники
      app: dbMaterial.applications || [],
      url: dbMaterial.reference_urls?.[0] || '',
      ref: dbMaterial.reference_titles?.[0] || '',
      
      // Дополнительные поля
      comments: dbMaterial.comments,
      source_file: dbMaterial.source_file,
      created_at: dbMaterial.created_at,
      
      // Добавляем флаг что это из БД
      _source: 'supabase'
    };
  }
  
  /**
   * Получить материал по ID
   * @param {string} id - UUID материала
   * @returns {Promise<Object>} Материал
   */
  async getMaterial(id) {
    if (this.cache.has(id)) {
      return this.cache.get(id);
    }
    
    try {
      const dbMaterial = await materialsAPI.getMaterial(id);
      const material = this.convertToTomlFormat(dbMaterial);
      this.cache.set(id, material);
      return material;
      
    } catch (error) {
      console.error(`Ошибка загрузки материала ${id}:`, error);
      return null;
    }
  }
  
  /**
   * Поиск материалов (аналог существующих функций поиска)
   * @param {string} query - Поисковый запрос
   * @param {Object} filters - Дополнительные фильтры
   * @returns {Promise<Array>} Найденные материалы
   */
  async searchMaterials(query, filters = {}) {
    try {
      const result = await materialsAPI.getMaterials({
        search: query,
        materialType: filters.materialType,
        densityRange: filters.densityRange,
        applications: filters.applications,
        sortBy: filters.sortBy || 'name',
        sortAsc: filters.sortAsc !== false,
        limit: filters.limit || 100
      });
      
      return result.data.map(this.convertToTomlFormat);
      
    } catch (error) {
      console.error('Ошибка поиска материалов:', error);
      return [];
    }
  }
}

/**
 * Пример 2: Интеграция с существующим DataTable
 * Адаптер для работы с jQuery DataTables
 */
class SupabaseDataTableAdapter {
  constructor(tableId) {
    this.tableId = tableId;
    this.table = null;
    this.loader = new SupabaseMaterialLoader();
  }
  
  /**
   * Инициализация DataTable с данными из Supabase
   * @param {Object} options - Опции DataTable
   */
  async initializeDataTable(options = {}) {
    try {
      // Проверяем что jQuery и DataTables загружены
      if (typeof $ === 'undefined' || !$.fn.DataTable) {
        throw new Error('jQuery DataTables не загружен');
      }
      
      const defaultOptions = {
        processing: true,
        serverSide: true,
        ajax: (data, callback, settings) => {
          this.loadDataTableData(data, callback, settings);
        },
        columns: [
          { data: 'name', title: 'Название' },
          { data: 'material_type', title: 'Тип материала' },
          { data: 'density', title: 'Плотность' },
          { data: 'youngs_modulus', title: 'Модуль Юнга' },
          { data: 'applications', title: 'Применения', render: (data) => {
            return Array.isArray(data) ? data.slice(0, 2).join(', ') + (data.length > 2 ? '...' : '') : '';
          }},
          { data: 'id', title: 'Действия', orderable: false, render: (data) => {
            return `<button class="btn btn-sm btn-primary" onclick="viewMaterial('${data}')">Просмотр</button>`;
          }}
        ],
        language: {
          url: '//cdn.datatables.net/plug-ins/1.13.7/i18n/Russian.json'
        }
      };
      
      const finalOptions = { ...defaultOptions, ...options };
      this.table = $(this.tableId).DataTable(finalOptions);
      
      return this.table;
      
    } catch (error) {
      console.error('Ошибка инициализации DataTable:', error);
      throw error;
    }
  }
  
  /**
   * Загрузка данных для DataTable
   * @param {Object} data - Параметры запроса от DataTable
   * @param {Function} callback - Функция обратного вызова
   * @param {Object} settings - Настройки DataTable
   */
  async loadDataTableData(data, callback, settings) {
    try {
      const page = Math.floor(data.start / data.length);
      const limit = data.length;
      const search = data.search?.value || '';
      
      // Определяем сортировку
      let sortBy = 'name';
      let sortAsc = true;
      
      if (data.order && data.order.length > 0) {
        const orderColumn = data.order[0];
        const columnName = data.columns[orderColumn.column].data;
        sortBy = columnName;
        sortAsc = orderColumn.dir === 'asc';
      }
      
      const result = await materialsAPI.getMaterials({
        page,
        limit,
        search,
        sortBy,
        sortAsc
      });
      
      // Конвертируем данные для DataTable
      const materials = result.data.map(material => ({
        ...material,
        material_type: material.material_type_code || 'N/A',
        density: material.density ? material.density.toLocaleString() : 'N/A',
        youngs_modulus: material.youngs_modulus ? material.youngs_modulus.toLocaleString() : 'N/A'
      }));
      
      callback({
        draw: data.draw,
        recordsTotal: result.total,
        recordsFiltered: result.total,
        data: materials
      });
      
    } catch (error) {
      console.error('Ошибка загрузки данных для DataTable:', error);
      callback({
        draw: data.draw,
        recordsTotal: 0,
        recordsFiltered: 0,
        data: [],
        error: error.message
      });
    }
  }
  
  /**
   * Обновление таблицы
   */
  refresh() {
    if (this.table) {
      this.table.ajax.reload();
    }
  }
}

/**
 * Пример 3: Интеграция с поиском и фильтрацией
 */
class SupabaseSearchManager {
  constructor() {
    this.loader = new SupabaseMaterialLoader();
    this.currentFilters = {};
    this.searchHistory = [];
  }
  
  /**
   * Выполняет поиск с сохранением истории
   * @param {string} query - Поисковый запрос
   * @param {Object} filters - Фильтры
   * @returns {Promise<Array>} Результаты поиска
   */
  async performSearch(query, filters = {}) {
    try {
      // Сохраняем в историю
      this.searchHistory.push({
        query,
        filters: { ...filters },
        timestamp: new Date()
      });
      
      // Ограничиваем историю 50 записями
      if (this.searchHistory.length > 50) {
        this.searchHistory = this.searchHistory.slice(-50);
      }
      
      this.currentFilters = { ...filters };
      
      // Выполняем поиск
      const results = await this.loader.searchMaterials(query, filters);
      
      // Генерируем событие для обновления UI
      this.dispatchSearchEvent('search:completed', {
        query,
        filters,
        results,
        count: results.length
      });
      
      return results;
      
    } catch (error) {
      console.error('Ошибка поиска:', error);
      
      this.dispatchSearchEvent('search:error', {
        query,
        filters,
        error: error.message
      });
      
      return [];
    }
  }
  
  /**
   * Продвинутый поиск по параметрам
   * @param {Object} parameters - Параметры поиска
   * @returns {Promise<Array>} Результаты
   */
  async advancedSearch(parameters) {
    try {
      const results = await materialsAPI.advancedSearch(parameters);
      
      this.dispatchSearchEvent('search:advanced:completed', {
        parameters,
        results,
        count: results.length
      });
      
      return results;
      
    } catch (error) {
      console.error('Ошибка продвинутого поиска:', error);
      return [];
    }
  }
  
  /**
   * Получение статистики поиска
   * @returns {Object} Статистика
   */
  getSearchStats() {
    const recentSearches = this.searchHistory.slice(-10);
    const popularQueries = {};
    
    this.searchHistory.forEach(search => {
      const query = search.query.toLowerCase();
      popularQueries[query] = (popularQueries[query] || 0) + 1;
    });
    
    return {
      totalSearches: this.searchHistory.length,
      recentSearches,
      popularQueries: Object.entries(popularQueries)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5),
      currentFilters: this.currentFilters
    };
  }
  
  /**
   * Генерирует кастомное событие
   * @param {string} eventName - Название события
   * @param {Object} detail - Данные события
   */
  dispatchSearchEvent(eventName, detail) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(eventName, { detail }));
    }
  }
}

/**
 * Пример 4: Миграция существующей логики
 * Функции-адаптеры для плавной замены
 */

// Глобальные переменные для совместимости
window.supabaseMaterialLoader = new SupabaseMaterialLoader();
window.supabaseSearchManager = new SupabaseSearchManager();

/**
 * Замена функции loadMaterials (из MaterialApp.js)
 */
async function loadMaterialsFromSupabase() {
  return await window.supabaseMaterialLoader.loadMaterials();
}

/**
 * Замена функции searchMaterials
 * @param {string} query - Поисковый запрос
 * @returns {Promise<Array>} Результаты поиска
 */
async function searchMaterialsInSupabase(query) {
  return await window.supabaseSearchManager.performSearch(query);
}

/**
 * Функция для просмотра материала (вызывается из DataTable)
 * @param {string} materialId - UUID материала
 */
async function viewMaterial(materialId) {
  try {
    const material = await window.supabaseMaterialLoader.getMaterial(materialId);
    
    if (material) {
      // Открываем модальное окно или переходим на страницу материала
      showMaterialDetails(material);
    } else {
      alert('Материал не найден');
    }
    
  } catch (error) {
    console.error('Ошибка загрузки материала:', error);
    alert('Ошибка загрузки материала: ' + error.message);
  }
}

/**
 * Показать детали материала
 * @param {Object} material - Данные материала
 */
function showMaterialDetails(material) {
  // Пример создания модального окна
  const modalHtml = `
    <div class="modal fade" id="materialModal" tabindex="-1">
      <div class="modal-dialog modal-xl">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">${material.name}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div class="row">
              <div class="col-md-6">
                <h6>Основные параметры</h6>
                <table class="table table-sm">
                  <tr><td>Тип материала:</td><td>${material.material_type || 'N/A'}</td></tr>
                  <tr><td>Плотность:</td><td>${material.density || 'N/A'}</td></tr>
                  <tr><td>Модуль Юнга:</td><td>${material.youngs_modulus || 'N/A'}</td></tr>
                  <tr><td>Коэффициент Пуассона:</td><td>${material.poisson_ratio || 'N/A'}</td></tr>
                  <tr><td>Система единиц:</td><td>${material.units}</td></tr>
                </table>
              </div>
              <div class="col-md-6">
                <h6>Применения</h6>
                <ul>
                  ${material.app.map(app => `<li>${app}</li>`).join('')}
                </ul>
                ${material.url ? `<p><a href="${material.url}" target="_blank">Источник</a></p>` : ''}
              </div>
            </div>
            <div class="mt-3">
              <h6>LS-DYNA данные</h6>
              <pre class="bg-light p-3"><code>${material.mat_data}</code></pre>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Закрыть</button>
            <button type="button" class="btn btn-primary" onclick="copyMaterialData('${material.id}')">Копировать</button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Удаляем существующие модальные окна
  const existingModal = document.getElementById('materialModal');
  if (existingModal) {
    existingModal.remove();
  }
  
  // Добавляем новое модальное окно
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  
  // Показываем модальное окно
  if (typeof bootstrap !== 'undefined') {
    const modal = new bootstrap.Modal(document.getElementById('materialModal'));
    modal.show();
  } else if (typeof $ !== 'undefined') {
    $('#materialModal').modal('show');
  }
}

/**
 * Копирование данных материала
 * @param {string} materialId - UUID материала
 */
async function copyMaterialData(materialId) {
  try {
    const lsdynaData = await materialsAPI.exportMaterial(materialId);
    
    // Копируем в буфер обмена
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(lsdynaData);
      alert('Данные материала скопированы в буфер обмена');
    } else {
      // Fallback для старых браузеров
      const textArea = document.createElement('textarea');
      textArea.value = lsdynaData;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Данные материала скопированы в буфер обмена');
    }
    
  } catch (error) {
    console.error('Ошибка копирования:', error);
    alert('Ошибка копирования данных');
  }
}

// Экспорт для использования в других модулях
export {
  SupabaseMaterialLoader,
  SupabaseDataTableAdapter,
  SupabaseSearchManager,
  loadMaterialsFromSupabase,
  searchMaterialsInSupabase,
  viewMaterial,
  showMaterialDetails,
  copyMaterialData
};

// Глобальные функции для совместимости
if (typeof window !== 'undefined') {
  window.loadMaterialsFromSupabase = loadMaterialsFromSupabase;
  window.searchMaterialsInSupabase = searchMaterialsInSupabase;
  window.viewMaterial = viewMaterial;
  window.copyMaterialData = copyMaterialData;
}