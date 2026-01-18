//  @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'

export default [
  // 忽略根目录配置文件，避免 TypeScript 解析问题
  {
    ignores: ['eslint.config.js', 'vite.config.ts', 'prettier.config.js'],
  },
  ...tanstackConfig,
]
