/** @type {import('prettier').Config} */
const config = {
  // 不使用分号
  semi: false,
  // 使用单引号
  singleQuote: true,
  // 尾随逗号 (ES5+)
  trailingComma: 'all',
  // 行宽上限
  printWidth: 100,
  // 缩进宽度
  tabWidth: 2,
  // 使用空格缩进
  useTabs: false,
  // 箭头函数参数始终加括号
  arrowParens: 'always',
  // 换行符: 自动检测
  endOfLine: 'auto',
}

export default config
