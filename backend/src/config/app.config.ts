import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  cors: {
    origins: (
      process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:3000'
    ).split(','),
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  },
  proxy:
    process.env.HTTPS_PROXY || process.env.HTTP_PROXY || process.env.ALL_PROXY,
}));
