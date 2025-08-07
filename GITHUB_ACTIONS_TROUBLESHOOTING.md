# GitHub Actions Troubleshooting Guide

## Проблема: Actions не запускаются после создания issue

### Шаг 1: Проверьте настройки репозитория

1. Перейдите в **Settings** вашего репозитория на GitHub
2. В левом меню найдите **Actions** → **General**
3. Убедитесь, что выбрано:
   - ✅ **Allow all actions and reusable workflows**
   - ✅ **Allow actions created by GitHub**
   - ✅ **Allow actions by Marketplace verified creators**

### Шаг 2: Проверьте права доступа

В разделе **Actions** → **General** найдите **Workflow permissions**:
- ✅ Выберите **Read and write permissions**
- ✅ Поставьте галочку **Allow GitHub Actions to create and approve pull requests**

### Шаг 3: Проверьте вкладку Actions

1. Перейдите на вкладку **Actions** в репозитории
2. Если вкладки нет, значит Actions отключены - включите их в Settings

### Шаг 4: Тестирование

После настройки создайте тестовый issue:

1. Перейдите в **Issues** → **New issue**
2. Выберите **🧪 Material Submission**
3. Заполните форму и создайте issue
4. Проверьте вкладку **Actions** - должны появиться запущенные workflows

### Шаг 5: Отладка

Если Actions все еще не работают:

1. Создайте любой issue (не обязательно material submission)
2. Проверьте, появился ли workflow **Test Actions**
3. Если да - проблема в условиях запуска основного workflow
4. Если нет - проблема в настройках репозитория

### Возможные проблемы и решения

#### 1. Actions отключены в организации
Если репозиторий принадлежит организации, проверьте настройки организации.

#### 2. Неправильные права доступа
Убедитесь, что у вас есть права администратора репозитория.

#### 3. Проблемы с YAML синтаксисом
Проверьте файлы workflow на наличие синтаксических ошибок.

#### 4. Условия запуска не выполняются
Основной workflow запускается только если:
- В заголовке issue есть `[MATERIAL]` ИЛИ
- У issue есть лейбл `material-submission`

### Файлы для проверки

Убедитесь, что существуют следующие файлы:

```
.github/
├── ISSUE_TEMPLATE/
│   ├── material-submission.yml  ✅
│   └── config.yml              ✅
└── workflows/
    ├── process-material-submission.yml  ✅
    ├── debug-issues.yml                ✅ (временный)
    └── test-actions.yml                ✅ (временный)
```

### Логи и отладка

1. Перейдите в **Actions** → выберите workflow run
2. Нажмите на job для просмотра логов
3. Ищите ошибки в красных секциях

### Контакты

Если проблема не решается, создайте issue с описанием:
- Что вы делали
- Что ожидали
- Что получили
- Скриншоты настроек Actions