/**
 * Prettier 配置
 */

module.exports = {
  // 基础配置
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: true,
  quoteProps: 'as-needed',

  // JSX
  jsxSingleQuote: false,
  jsxBracketSameLine: false,

  // 尾随逗号
  trailingComma: 'es5',

  // 括号
  bracketSpacing: true,
  arrowParens: 'always',

  // 换行
  endOfLine: 'lf',

  // Markdown
  proseWrap: 'preserve',

  // HTML
  htmlWhitespaceSensitivity: 'css',

  // Vue
  vueIndentScriptAndStyle: false,

  // 覆盖配置
  overrides: [
    {
      files: '*.json',
      options: {
        printWidth: 80,
      },
    },
    {
      files: '*.md',
      options: {
        proseWrap: 'always',
      },
    },
  ],
};


