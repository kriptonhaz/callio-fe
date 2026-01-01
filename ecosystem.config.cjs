const fs = require('fs')
const path = require('path')

const envPath = path.resolve(__dirname, '.env')
let port = 3000

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  const portMatch = envContent.match(/^PORT=(.*)$/m)
  if (portMatch) {
    port = parseInt(portMatch[1].trim(), 10)
  }
}

module.exports = {
  apps: [
    {
      name: 'callio-app',
      instances: 1,
      exec_mode: 'cluster',
      script: './dist/server/server.js',
      interpreter: 'bun',
      env: {
        NODE_ENV: 'production',
        PORT: port,
      },
    },
  ],
}
