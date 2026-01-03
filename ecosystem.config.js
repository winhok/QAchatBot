/**
 * PM2 进程管理配置
 * 用于生产环境部署
 */
module.exports = {
  apps: [
    {
      name: 'qachatbot-backend',
      cwd: './backend',
      script: 'dist/main.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },
      // 日志配置
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      // 自动重启配置
      watch: false,
      max_memory_restart: '1G',
      restart_delay: 5000,
    },
    {
      name: 'qachatbot-frontend',
      cwd: './frontend',
      script: 'node_modules/.bin/vite',
      args: 'preview --port 4173',
      interpreter: 'none',
      env_production: {
        NODE_ENV: 'production',
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
    },
  ],
}
