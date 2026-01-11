/**
 * PM2 进程管理配置 - Backend
 * 针对小内存服务器优化 (1.63G)
 */
module.exports = {
  apps: [
    {
      name: 'qachatbot-backend',
      script: 'dist/src/main.js',
      instances: 1,
      exec_mode: 'fork',
      node_args: '--max-old-space-size=512',
      env: {
        NODE_ENV: 'development',
        NODE_TLS_REJECT_UNAUTHORIZED: '0',
      },
      env_production: {
        NODE_ENV: 'production',
        NODE_TLS_REJECT_UNAUTHORIZED: '0',
      },
      // 日志配置
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      merge_logs: true,
      // 自动重启配置
      watch: false,
      max_memory_restart: '600M',
      restart_delay: 3000,
      max_restarts: 10,
      min_uptime: '10s',
    },
  ],
}
