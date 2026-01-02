module.exports = {
  apps: [
    {
      name: 'callio-app',
      script: './dist/server/server.js',
      interpreter: 'bun',
      exec_mode: 'fork',
      instances: 1,
      env: {
        NODE_ENV: 'production',
        PORT: 3004,
        VITE_API_BASE_URL: 'https://api.callio-tech.com/api/',
      },
    },
  ],
}
