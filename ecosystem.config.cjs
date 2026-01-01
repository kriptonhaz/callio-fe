module.exports = {
  apps: [
    {
      name: 'callio-app',
      port: 3000,
      instances: 1,
      exec_mode: 'cluster',
      script: './dist/server/server.js',
      interpreter: 'bun',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
}
