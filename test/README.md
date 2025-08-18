# Material MAP - Testing

This directory contains test files for the Material MAP project.

## 📁 Directory Structure

```
test/
├── src/                          # Modular ES6 architecture for testing
│   └── js/
│       ├── components/           # UI components
│       ├── modules/              # Business logic modules
│       ├── utils/                # Utility functions
│       ├── MaterialApp.js        # Main application class
│       └── main.js               # Entry point
├── direct-conversion.spec.js     # Unit tests for direct conversion
├── units-conversion-fixed.spec.js # Fixed unit conversion tests
└── units-conversion.spec.js      # Unit conversion tests
```

## 🧪 Testing

The test files in this directory are used to verify the functionality of the Material MAP project, particularly focusing on unit conversion and data processing.

## 🔧 Running Tests

To run the tests, use the following command from the project root:

```bash
npm test
```

This will execute the Playwright tests defined in the spec files.

