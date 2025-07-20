module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: ['@typescript-eslint', 'prettier'],
  extends: ['eslint:recommended', 'prettier'],
  env: {
    node: true,
    es6: true,
    jest: true,
  },
  rules: {
    // Kullanılmayan import'lar ve değişkenler
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      },
    ],
    'no-unused-vars': 'off', // TypeScript versiyonunu kullan

    // Kullanılmayan import'lar
    '@typescript-eslint/no-unused-expressions': 'error',

    // Prettier entegrasyonu
    'prettier/prettier': 'error',

    // TypeScript özel kurallar
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-non-null-assertion': 'warn',

    // Genel kurallar
    'no-console': 'warn',
    'no-debugger': 'error',
    'no-alert': 'error',
    'no-var': 'error',
    'prefer-const': 'error',

    // Dependency injection kuralları
    '@typescript-eslint/no-empty-function': 'off', // Constructor'lar için
  },
  ignorePatterns: [
    'dist/',
    'node_modules/',
    '*.js',
    '*.d.ts',
    'coverage/',
    'build/',
  ],
};
