// One command to get Sweety running on a fresh machine:   npm run setup
// Needs Node.js 20+ and Docker. Uses only Node's built-in modules, so it runs before anything is installed.
import { execSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const root = join(import.meta.dirname, '..')
const run = (command, cwd = root) => execSync(command, { stdio: 'inherit', cwd })
const step = (n, text) => console.log(`\n\x1b[1m[${n}/5] ${text}\x1b[0m`)

function fail(message) {
  console.error(`\n✖ ${message}`)
  process.exit(1)
}

// 1. Check the tools we need are installed
step(1, 'Checking Node.js and Docker')
const nodeMajor = Number(process.versions.node.split('.')[0])
if (nodeMajor < 20) fail(`Node.js 20 or newer is needed (you have ${process.versions.node}).`)
try {
  execSync('docker compose version', { stdio: 'ignore' })
} catch {
  fail('Docker with "docker compose" is needed. Install Docker Desktop, start it, then run npm run setup again.')
}
console.log(`✔ Node ${process.versions.node} and Docker found`)

// 2. Create .env files from the examples (never overwrites an existing one)
step(2, 'Creating .env files')
for (const folder of ['server', 'clientSide']) {
  const target = join(root, folder, '.env')
  if (existsSync(target)) {
    console.log(`✔ ${folder}/.env already exists, keeping it`)
    continue
  }
  copyFileSync(join(root, folder, '.env.example'), target)
  if (folder === 'server') {
    // Give this machine its own random secret for signing login tokens
    const secret = randomBytes(32).toString('hex')
    writeFileSync(target, readFileSync(target, 'utf8').replace('change-me-to-a-long-random-string', secret))
  }
  console.log(`✔ Created ${folder}/.env`)
}

// 3. Install packages for the root (dev runner), the API and the web app
step(3, 'Installing packages (this can take a minute)')
run('npm install --no-audit --no-fund')
run('npm install --no-audit --no-fund', join(root, 'server'))
run('npm install --no-audit --no-fund', join(root, 'clientSide'))

// 4. Start PostgreSQL, Redis and Mailpit, and wait until they report healthy
step(4, 'Starting PostgreSQL, Redis and Mailpit in Docker')
run('docker compose up -d --wait')

// 5. Create the tables (dev + test databases) and the demo user
step(5, 'Creating the database tables and the demo user')
run('npm run db:setup', join(root, 'server'))
run('npm run seed', join(root, 'server'))

console.log(`
\x1b[32m✔ Sweety is ready.\x1b[0m

  Start everything:   npm run dev
  Then open:          http://localhost:5173
  Demo login:         demo@sweety.app  /  sweety123
  Test inbox:         http://localhost:8025   (report emails to doctors land here)
  Run the tests:      npm test
  Stop the databases: npm run stop

Note: running setup again resets the database to the demo data.
`)
