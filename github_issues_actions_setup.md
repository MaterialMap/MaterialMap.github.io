# GitHub Issues + GitHub Actions: Автоматическое добавление материалов

## Обзор решения

Система позволяет пользователям добавлять новые материалы через веб-форму, которая автоматически создает GitHub Issue. GitHub Action обрабатывает Issue, генерирует YAML файл и создает Pull Request.

### Схема работы:
```
Веб-форма → GitHub Issue → GitHub Action → YAML файл → Pull Request → Review → Merge
```

---

## 1. Настройка GitHub репозитория

### 1.1 Включение Issues
1. Перейдите в Settings репозитория
2. В разделе "Features" убедитесь, что включены:
   - ✅ Issues
   - ✅ Discussions (опционально)

### 1.2 Настройка Labels
Создайте labels для категоризации материалов:

```bash
# Через GitHub CLI
gh label create "material-submission" --color "0E8A16" --description "New material submission"
gh label create "needs-review" --color "FBCA04" --description "Requires manual review"
gh label create "auto-processed" --color "0052CC" --description "Automatically processed"
gh label create "invalid-format" --color "D93F0B" --description "Invalid YAML format"
```

---

## 2. Создание Issue Templates

### 2.1 Создайте файл `.github/ISSUE_TEMPLATE/material-submission.yml`

```yaml
name: 🧪 Material Submission
description: Submit a new LS-DYNA material model
title: "[MATERIAL] "
labels: ["material-submission"]
body:
  - type: markdown
    attributes:
      value: |
        Thanks for contributing to MaterialMap! Please fill out the form below to submit a new material model.
        
        **Note:** All fields marked with * are required.

  - type: input
    id: material_name
    attributes:
      label: Material Name *
      description: Name of the material (e.g., "Steel AISI 4340", "Aluminum 6061-T6")
      placeholder: ex. Steel AISI 4340
    validations:
      required: true

  - type: dropdown
    id: material_id
    attributes:
      label: LS-DYNA Material ID *
      description: Select the LS-DYNA material model ID
      options:
        - MAT_001 - MAT_ELASTIC
        - MAT_003 - MAT_PLASTIC_KINEMATIC
        - MAT_015 - MAT_JOHNSON_COOK
        - MAT_024 - MAT_PIECEWISE_LINEAR_PLASTICITY
        - MAT_077 - MAT_HYPERELASTIC_RUBBER
        - MAT_107 - MAT_MODIFIED_JOHNSON_COOK
        - MAT_159 - MAT_CSCM
        - MAT_224 - MAT_TABULATED_JOHNSON_COOK
        - MAT_258 - MAT_NON_QUADRATIC_FAILURE
        - Other (specify in material data)
    validations:
      required: true

  - type: textarea
    id: material_data
    attributes:
      label: Material Data *
      description: Paste the LS-DYNA material card data here
      placeholder: |
        *MAT_JOHNSON_COOK_TITLE
        Steel AISI 4340
        $--------1---------2---------3---------4---------5---------6---------7---------8
        $#     MID        RO         E        PR       DTF        VP    RATEOP
             15     7.83e-9    200000      0.29         0         0         0
        ...
      render: text
    validations:
      required: true

  - type: dropdown
    id: eos_model
    attributes:
      label: Equation of State (EOS)
      description: Select EOS if applicable
      options:
        - None
        - EOS_GRUNEISEN
        - EOS_LINEAR_POLYNOMIAL
        - EOS_TABULATED
        - EOS_IDEAL_GAS
        - Other (specify in EOS data)

  - type: textarea
    id: eos_data
    attributes:
      label: EOS Data
      description: Paste EOS data if applicable
      placeholder: |
        *EOS_GRUNEISEN_TITLE
        Steel AISI 4340
        $#   EOSID         C        S1        S2        S3    GAMMAO         A        E0
             15    0.4610      1.73         0         0      2.17         0         0
      render: text

  - type: textarea
    id: applications
    attributes:
      label: Applications *
      description: List applications/use cases (one per line)
      placeholder: |
        High-strength steel applications
        Automotive components
        Ballistic applications
    validations:
      required: true

  - type: input
    id: reference
    attributes:
      label: Reference *
      description: Full citation of the source paper/document
      placeholder: ex. Smith, J. et al. (2023). Material characterization of AISI 4340 steel. Journal of Materials, 15(3), 123-145.
    validations:
      required: true

  - type: input
    id: reference_url
    attributes:
      label: Reference URL *
      description: Link to the source (must be open access)
      placeholder: https://doi.org/10.1000/example
    validations:
      required: true

  - type: textarea
    id: additional_info
    attributes:
      label: Additional Information
      description: Any additional notes or context about this material
      placeholder: Special notes, validation data, limitations, etc.

  - type: checkboxes
    id: terms
    attributes:
      label: Submission Requirements
      description: Please confirm the following
      options:
        - label: The source is published under Open Access license
          required: true
        - label: I have verified the material parameters are correct
          required: true
        - label: The reference URL is accessible without paywall
          required: true
```

### 2.2 Создайте файл `.github/ISSUE_TEMPLATE/config.yml`

```yaml
blank_issues_enabled: false
contact_links:
  - name: 📚 Documentation
    url: https://yurynovozhilov.github.io/MaterialMap/about.html
    about: Learn more about the MaterialMap project
  - name: 🐛 Bug Report
    url: https://github.com/yurynovozhilov/MaterialMap/issues/new
    about: Report bugs or issues with the website
```

---

## 3. Настройка GitHub Action

### 3.1 Создайте файл `.github/workflows/process-material-submission.yml`

```yaml
name: Process Material Submission

on:
  issues:
    types: [opened]

jobs:
  process-submission:
    if: contains(github.event.issue.labels.*.name, 'material-submission')
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
      issues: write

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Parse Issue Content
        id: parse-issue
        uses: actions/github-script@v7
        with:
          script: |
            const issueBody = context.payload.issue.body;
            const issueTitle = context.payload.issue.title;
            
            // Parse form data using regex patterns
            function extractField(body, fieldName) {
              const regex = new RegExp(`### ${fieldName}\\s*\\n\\s*([\\s\\S]*?)(?=\\n### |\\n\\n###|$)`, 'i');
              const match = body.match(regex);
              return match ? match[1].trim() : '';
            }
            
            const materialName = extractField(issueBody, 'Material Name');
            const materialId = extractField(issueBody, 'LS-DYNA Material ID');
            const materialData = extractField(issueBody, 'Material Data');
            const eosModel = extractField(issueBody, 'Equation of State');
            const eosData = extractField(issueBody, 'EOS Data');
            const applications = extractField(issueBody, 'Applications');
            const reference = extractField(issueBody, 'Reference');
            const referenceUrl = extractField(issueBody, 'Reference URL');
            const additionalInfo = extractField(issueBody, 'Additional Information');
            
            // Validate required fields
            if (!materialName || !materialId || !materialData || !applications || !reference || !referenceUrl) {
              throw new Error('Missing required fields');
            }
            
            // Create YAML content
            const today = new Date().toISOString().split('T')[0];
            const authorName = context.payload.issue.user.login;
            
            // Parse applications into array
            const appArray = applications.split('\n')
              .map(app => app.trim())
              .filter(app => app.length > 0);
            
            // Generate filename from reference (first author + year)
            const refMatch = reference.match(/^([^,]+).*?(\d{4})/);
            const filename = refMatch ? 
              `${refMatch[1].trim().replace(/\s+/g, ' ')} ${refMatch[2]}.yaml` : 
              `${materialName.replace(/[^a-zA-Z0-9]/g, '_')} ${today}.yaml`;
            
            // Build YAML structure
            let yamlContent = `- material:\n`;
            yamlContent += `    id: ${materialId}\n`;
            yamlContent += `    mat: ${materialId.replace('MAT_', 'MAT_')}\n`;
            yamlContent += `    mat_data: |\n`;
            
            // Indent material data
            const indentedMatData = materialData.split('\n')
              .map(line => `      ${line}`)
              .join('\n');
            yamlContent += `${indentedMatData}\n`;
            
            // Add EOS if present
            if (eosModel && eosModel !== 'None' && eosData) {
              yamlContent += `    eos: ${eosModel}\n`;
              yamlContent += `    eos_data: |\n`;
              const indentedEosData = eosData.split('\n')
                .map(line => `      ${line}`)
                .join('\n');
              yamlContent += `${indentedEosData}\n`;
            }
            
            // Add applications
            yamlContent += `    app:\n`;
            appArray.forEach(app => {
              yamlContent += `      - ${app}\n`;
            });
            
            // Add metadata
            yamlContent += `    ref: "${reference}"\n`;
            yamlContent += `    add: ${today}\n`;
            yamlContent += `    url: "${referenceUrl}"\n`;
            
            // Set outputs
            core.setOutput('yaml-content', yamlContent);
            core.setOutput('filename', filename);
            core.setOutput('material-name', materialName);
            core.setOutput('author', authorName);
            core.setOutput('issue-number', context.payload.issue.number);
            
            return {
              yamlContent,
              filename,
              materialName,
              author: authorName
            };

      - name: Validate YAML
        id: validate-yaml
        uses: actions/github-script@v7
        with:
          script: |
            const yaml = require('js-yaml');
            const yamlContent = `${{ steps.parse-issue.outputs.yaml-content }}`;
            
            try {
              const parsed = yaml.load(yamlContent);
              console.log('YAML validation successful');
              return true;
            } catch (error) {
              console.error('YAML validation failed:', error.message);
              throw new Error(`Invalid YAML format: ${error.message}`);
            }

      - name: Create material file
        run: |
          mkdir -p data
          echo '${{ steps.parse-issue.outputs.yaml-content }}' > "data/${{ steps.parse-issue.outputs.filename }}"

      - name: Update file list
        run: |
          # Update dist/file-list.json
          if [ -f "dist/file-list.json" ]; then
            # Add new file to the list
            python3 -c "
            import json
            import sys
            
            filename = '${{ steps.parse-issue.outputs.filename }}'
            
            try:
                with open('dist/file-list.json', 'r') as f:
                    files = json.load(f)
            except:
                files = []
            
            if filename not in files:
                files.append(filename)
                files.sort()
                
                with open('dist/file-list.json', 'w') as f:
                    json.dump(files, f, indent=2)
                    
                print(f'Added {filename} to file list')
            else:
                print(f'{filename} already exists in file list')
            "
          else
            echo "Warning: dist/file-list.json not found"
          fi

      - name: Create Pull Request
        id: create-pr
        uses: peter-evans/create-pull-request@v5
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          commit-message: |
            Add material: ${{ steps.parse-issue.outputs.material-name }}
            
            - Added by: @${{ steps.parse-issue.outputs.author }}
            - Source issue: #${{ steps.parse-issue.outputs.issue-number }}
          title: "Add material: ${{ steps.parse-issue.outputs.material-name }}"
          body: |
            ## New Material Submission
            
            **Material:** ${{ steps.parse-issue.outputs.material-name }}
            **Submitted by:** @${{ steps.parse-issue.outputs.author }}
            **Source Issue:** #${{ steps.parse-issue.outputs.issue-number }}
            
            ### Changes
            - Added `data/${{ steps.parse-issue.outputs.filename }}`
            - Updated `dist/file-list.json`
            
            ### Review Checklist
            - [ ] YAML format is valid
            - [ ] Reference is accessible and open access
            - [ ] Material parameters are reasonable
            - [ ] Applications are accurate
            - [ ] No duplicate entries
            
            Auto-generated from issue submission.
          branch: material-submission-${{ steps.parse-issue.outputs.issue-number }}
          delete-branch: true
          labels: |
            material-submission
            needs-review

      - name: Comment on Issue - Success
        if: success()
        uses: actions/github-script@v7
        with:
          script: |
            const prNumber = '${{ steps.create-pr.outputs.pull-request-number }}';
            const prUrl = '${{ steps.create-pr.outputs.pull-request-url }}';
            
            await github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: ${{ steps.parse-issue.outputs.issue-number }},
              body: `✅ **Submission processed successfully!**
              
              Your material submission has been automatically processed and a pull request has been created:
              
              **Pull Request:** ${prUrl}
              **File:** \`data/${{ steps.parse-issue.outputs.filename }}\`
              
              The material will be reviewed by maintainers and merged if everything looks good. You'll be notified when the review is complete.
              
              Thank you for contributing to MaterialMap! 🎉`
            });
            
            // Add labels
            await github.rest.issues.addLabels({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: ${{ steps.parse-issue.outputs.issue-number }},
              labels: ['auto-processed']
            });

      - name: Comment on Issue - Failure
        if: failure()
        uses: actions/github-script@v7
        with:
          script: |
            await github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: ${{ steps.parse-issue.outputs.issue-number }},
              body: `❌ **Submission processing failed**
              
              There was an error processing your material submission. This could be due to:
              
              - Invalid YAML format in material data
              - Missing required fields
              - Technical error in processing
              
              Please check your submission and try again, or contact the maintainers for help.
              
              **Error details can be found in the [workflow run](https://github.com/${{ github.repository }}/actions/runs/${{ github.run_id }}).**`
            });
            
            // Add labels
            await github.rest.issues.addLabels({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: ${{ steps.parse-issue.outputs.issue-number }},
              labels: ['invalid-format', 'needs-review']
            });
```

---

## 4. Создание веб-формы

### 4.1 Создайте файл `submit.html`

```html
<!doctype html>
<html lang="en">
<head>
    <title>Submit Material - Material MAP</title>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="stylesheet" href="styles.css" />
    <style>
        .form-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: 600;
        }
        
        .form-group input,
        .form-group select,
        .form-group textarea {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-family: inherit;
        }
        
        .form-group textarea {
            min-height: 120px;
            font-family: 'Courier New', monospace;
            font-size: 14px;
        }
        
        .required {
            color: #e74c3c;
        }
        
        .submit-btn {
            background-color: #4169E1;
            color: white;
            padding: 12px 30px;
            border: none;
            border-radius: 4px;
            font-size: 16px;
            cursor: pointer;
            margin-right: 10px;
        }
        
        .submit-btn:hover {
            background-color: #27408B;
        }
        
        .preview-btn {
            background-color: #6c757d;
            color: white;
            padding: 12px 30px;
            border: none;
            border-radius: 4px;
            font-size: 16px;
            cursor: pointer;
        }
        
        .preview-container {
            margin-top: 20px;
            padding: 15px;
            background-color: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 4px;
            display: none;
        }
        
        .help-text {
            font-size: 14px;
            color: #666;
            margin-top: 5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Submit New Material</h1>
        
        <div class="form-container">
            <form id="material-form">
                <div class="form-group">
                    <label for="material-name">Material Name <span class="required">*</span></label>
                    <input type="text" id="material-name" name="materialName" required
                           placeholder="e.g., Steel AISI 4340, Aluminum 6061-T6">
                    <div class="help-text">Descriptive name of the material</div>
                </div>

                <div class="form-group">
                    <label for="material-id">LS-DYNA Material Model <span class="required">*</span></label>
                    <select id="material-id" name="materialId" required>
                        <option value="">Select material model...</option>
                        <option value="MAT_001">MAT_001 - MAT_ELASTIC</option>
                        <option value="MAT_003">MAT_003 - MAT_PLASTIC_KINEMATIC</option>
                        <option value="MAT_015">MAT_015 - MAT_JOHNSON_COOK</option>
                        <option value="MAT_024">MAT_024 - MAT_PIECEWISE_LINEAR_PLASTICITY</option>
                        <option value="MAT_077">MAT_077 - MAT_HYPERELASTIC_RUBBER</option>
                        <option value="MAT_107">MAT_107 - MAT_MODIFIED_JOHNSON_COOK</option>
                        <option value="MAT_159">MAT_159 - MAT_CSCM</option>
                        <option value="MAT_224">MAT_224 - MAT_TABULATED_JOHNSON_COOK</option>
                        <option value="MAT_258">MAT_258 - MAT_NON_QUADRATIC_FAILURE</option>
                        <option value="other">Other (specify in material data)</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="material-data">Material Data <span class="required">*</span></label>
                    <textarea id="material-data" name="materialData" required
                              placeholder="*MAT_JOHNSON_COOK_TITLE&#10;Steel AISI 4340&#10;$--------1---------2---------3---------4---------5---------6---------7---------8&#10;$#     MID        RO         E        PR       DTF        VP    RATEOP&#10;        15     7.83e-9    200000      0.29         0         0         0&#10;..."></textarea>
                    <div class="help-text">Paste the complete LS-DYNA material card</div>
                </div>

                <div class="form-group">
                    <label for="eos-model">Equation of State (EOS)</label>
                    <select id="eos-model" name="eosModel">
                        <option value="">None</option>
                        <option value="EOS_GRUNEISEN">EOS_GRUNEISEN</option>
                        <option value="EOS_LINEAR_POLYNOMIAL">EOS_LINEAR_POLYNOMIAL</option>
                        <option value="EOS_TABULATED">EOS_TABULATED</option>
                        <option value="EOS_IDEAL_GAS">EOS_IDEAL_GAS</option>
                        <option value="other">Other (specify in EOS data)</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="eos-data">EOS Data</label>
                    <textarea id="eos-data" name="eosData"
                              placeholder="*EOS_GRUNEISEN_TITLE&#10;Steel AISI 4340&#10;$#   EOSID         C        S1        S2        S3    GAMMAO         A        E0&#10;        15    0.4610      1.73         0         0      2.17         0         0"></textarea>
                    <div class="help-text">EOS parameters if applicable</div>
                </div>

                <div class="form-group">
                    <label for="applications">Applications <span class="required">*</span></label>
                    <textarea id="applications" name="applications" required
                              placeholder="High-strength steel applications&#10;Automotive components&#10;Ballistic applications"
                              style="min-height: 80px;"></textarea>
                    <div class="help-text">List applications, one per line</div>
                </div>

                <div class="form-group">
                    <label for="reference">Reference <span class="required">*</span></label>
                    <textarea id="reference" name="reference" required
                              placeholder="Smith, J. et al. (2023). Material characterization of AISI 4340 steel. Journal of Materials, 15(3), 123-145."
                              style="min-height: 60px;"></textarea>
                    <div class="help-text">Full citation of the source paper/document</div>
                </div>

                <div class="form-group">
                    <label for="reference-url">Reference URL <span class="required">*</span></label>
                    <input type="url" id="reference-url" name="referenceUrl" required
                           placeholder="https://doi.org/10.1000/example">
                    <div class="help-text">Direct link to open access publication</div>
                </div>

                <div class="form-group">
                    <label for="additional-info">Additional Information</label>
                    <textarea id="additional-info" name="additionalInfo"
                              placeholder="Special notes, validation data, limitations, etc."
                              style="min-height: 80px;"></textarea>
                </div>

                <div class="form-group">
                    <button type="button" class="preview-btn" onclick="generatePreview()">
                        Preview YAML
                    </button>
                    <button type="submit" class="submit-btn">
                        Submit via GitHub
                    </button>
                </div>
            </form>

            <div id="preview" class="preview-container">
                <h3>Generated YAML Preview:</h3>
                <pre id="yaml-preview"></pre>
            </div>
        </div>

        <div class="about-link">
            <p><a href="index.html">← Back to Materials Database</a></p>
        </div>
    </div>

    <script>
        function generatePreview() {
            const formData = new FormData(document.getElementById('material-form'));
            const data = Object.fromEntries(formData);
            
            // Generate YAML content
            const today = new Date().toISOString().split('T')[0];
            const applications = data.applications.split('\n')
                .map(app => app.trim())
                .filter(app => app.length > 0);
            
            let yaml = `- material:\n`;
            yaml += `    id: ${data.materialId}\n`;
            yaml += `    mat: ${data.materialId}\n`;
            yaml += `    mat_data: |\n`;
            
            // Indent material data
            const matLines = data.materialData.split('\n');
            matLines.forEach(line => {
                yaml += `      ${line}\n`;
            });
            
            // Add EOS if present
            if (data.eosModel && data.eosData) {
                yaml += `    eos: ${data.eosModel}\n`;
                yaml += `    eos_data: |\n`;
                data.eosData.split('\n').forEach(line => {
                    yaml += `      ${line}\n`;
                });
            }
            
            // Add applications
            yaml += `    app:\n`;
            applications.forEach(app => {
                yaml += `      - ${app}\n`;
            });
            
            // Add metadata
            yaml += `    ref: "${data.reference}"\n`;
            yaml += `    add: ${today}\n`;
            yaml += `    url: "${data.referenceUrl}"\n`;
            
            document.getElementById('yaml-preview').textContent = yaml;
            document.getElementById('preview').style.display = 'block';
        }
        
        document.getElementById('material-form').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const data = Object.fromEntries(formData);
            
            // Validate required fields
            const required = ['materialName', 'materialId', 'materialData', 'applications', 'reference', 'referenceUrl'];
            const missing = required.filter(field => !data[field] || data[field].trim() === '');
            
            if (missing.length > 0) {
                alert(`Please fill in all required fields: ${missing.join(', ')}`);
                return;
            }
            
            // Generate GitHub Issue URL
            const title = `[MATERIAL] ${data.materialName}`;
            let body = `### Material Name\n${data.materialName}\n\n`;
            body += `### LS-DYNA Material ID\n${data.materialId}\n\n`;
            body += `### Material Data\n\`\`\`\n${data.materialData}\n\`\`\`\n\n`;
            
            if (data.eosModel) {
                body += `### Equation of State\n${data.eosModel}\n\n`;
            }
            if (data.eosData) {
                body += `### EOS Data\n\`\`\`\n${data.eosData}\n\`\`\`\n\n`;
            }
            
            body += `### Applications\n${data.applications}\n\n`;
            body += `### Reference\n${data.reference}\n\n`;
            body += `### Reference URL\n${data.referenceUrl}\n\n`;
            
            if (data.additionalInfo) {
                body += `### Additional Information\n${data.additionalInfo}\n\n`;
            }
            
            // Create GitHub Issue URL
            const issueUrl = `https://github.com/yurynovozhilov/MaterialMap/issues/new?` +
                `title=${encodeURIComponent(title)}&` +
                `body=${encodeURIComponent(body)}&` +
                `labels=material-submission`;
            
            // Open in new tab
            window.open(issueUrl, '_blank');
        });
    </script>
</body>
</html>
```

### 4.2 Добавьте ссылку на форму в `index.html`

```html
<!-- В контейнер после таблицы -->
<div class="submit-link">
    <p><a href="submit.html" class="submit-button">📝 Submit New Material</a></p>
</div>
```

### 4.3 Добавьте стили в `styles.css`

```css
.submit-link {
    margin-top: 30px;
    text-align: center;
}

.submit-button {
    display: inline-block;
    background-color: #28a745;
    color: white;
    padding: 12px 24px;
    text-decoration: none;
    border-radius: 6px;
    font-weight: 500;
    transition: background-color 0.2s;
}

.submit-button:hover {
    background-color: #218838;
    text-decoration: none;
}
```

---

## 5. Настройка прав доступа

### 5.1 В файле `.github/workflows/process-material-submission.yml` проверьте права:

```yaml
permissions:
  contents: write          # Создание файлов и коммитов
  pull-requests: write     # Создание PR
  issues: write           # Комментирование Issues
```

### 5.2 Включите автоматические Actions в Settings репозитория:
- Settings → Actions → General
- Выберите "Allow all actions and reusable workflows"

---

## 6. Тестирование

### 6.1 Локальное тестирование формы:
1. Откройте `submit.html` в браузере
2. Заполните форму тестовыми данными
3. Нажмите "Preview YAML" для проверки генерации
4. Нажмите "Submit via GitHub" (откроется GitHub с предзаполненным Issue)

### 6.2 Тестирование GitHub Action:
1. Создайте тестовый Issue с label "material-submission"
2. Проверьте, что Action запустился
3. Убедитесь, что создался PR
4. Проверьте содержимое созданного YAML файла

---

## 7. Инструкции для пользователей

### 7.1 Создайте файл `CONTRIBUTING.md`

```markdown
# Contributing to MaterialMap

## How to Submit New Materials

### Option 1: Web Form (Recommended)
1. Visit the [submission form](https://yurynovozhilov.github.io/MaterialMap/submit.html)
2. Fill in all required fields
3. Click "Preview YAML" to verify the format
4. Click "Submit via GitHub" to create an issue
5. Sign in to GitHub and submit the issue
6. Wait for automatic processing and review

### Option 2: Manual GitHub Issue
1. Go to [Issues](https://github.com/yurynovozhilov/MaterialMap/issues/new/choose)
2. Select "Material Submission" template
3. Fill in all required information
4. Submit the issue

### Option 3: Direct Pull Request
1. Fork the repository
2. Create a new YAML file in `/data/` folder
3. Follow the existing format
4. Update `/dist/file-list.json`
5. Submit a pull request

## Requirements
- Source must be Open Access
- LS-DYNA material parameters must be validated
- Reference URL must be accessible without paywall
- All required fields must be completed

## Review Process
1. Automatic processing creates a pull request
2. Maintainers review the submission
3. If approved, the material is merged into the database
4. You'll be notified of the final decision

Thank you for contributing to MaterialMap! 🎉
```

---

## 8. Мониторинг и обслуживание

### 8.1 Настройте уведомления:
- Settings → Notifications
- Включите уведомления для Issues и Pull Requests

### 8.2 Регулярное обслуживание:
- Проверяйте неудачные запуски Actions
- Обновляйте список материалов в форме
- Модерируйте новые submissions
- Закрывайте обработанные Issues

### 8.3 Мониторинг качества:
- Проверяйте валидность YAML файлов
- Верифицируйте доступность ссылок
- Контролируйте дубликаты материалов

---

## Заключение

Система автоматически обрабатывает submissions через Issues, создает PR и уведомляет пользователей. Maintainers только проверяют и мержат готовые PR.

**Основные преимущества:**
- ✅ Автоматизация рутинных задач
- ✅ Стандартизированный формат submission
- ✅ Контроль качества через review
- ✅ Прозрачный процесс для пользователей
- ✅ Минимальные требования к техническим знаниям