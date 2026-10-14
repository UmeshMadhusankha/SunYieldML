const globals = require('globals');
module.exports = [{ files: ['**/*.js'], languageOptions: { ecmaVersion: 2024, sourceType: 'commonjs', globals: { ...globals.node, ...globals.jest } }, rules: { 'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }], 'no-undef': 'error', 'no-unreachable': 'error' } }];
