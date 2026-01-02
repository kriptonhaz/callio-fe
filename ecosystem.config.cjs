module.exports = {
  apps: [
    {
      name: 'callio-app',
      script: './dist/server/server.js',
      interpreter: 'bun',
      instances: 1,
      exec_mode: 'fork',
      env_file: '.env',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
}
