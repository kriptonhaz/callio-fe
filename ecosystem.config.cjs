module.exports = {
  apps: [
    {
      name: 'callio-app',
      script: 'bun',
      args: 'run .output/server/index.mjs',
      cwd: '/home/callio/prod/callio-fe',
      env: {
        NODE_ENV: 'production',
        PORT: 3004,
      },
    },
  ],
}
