// One command to get Sweety running on a fresh machine:   npm run setup
// Needs Node.js 20+ and Docker. Uses only Node's built-in modules, so it runs before anything is installed.
import { execSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import net from 'node:net'
import { join } from 'node:path'

const root = join(import.meta.dirname, '..')
const run = (command, cwd = root) => execSync(command, { stdio: 'inherit', cwd })
const step = (n, text) => console.log(`\n\x1b[1m[${n}/5] ${text}\x1b[0m`)

function fail(message) {
  console.error(`\n✖ ${message}`)
  process.exit(1)
}

// Ports Docker publishes for Sweety (must be free, or setup can't start the containers)
// `alsoChange` is the setting in server/.env that has to match if someone moves the port.
const DOCKER_PORTS = [
  { port: 5433, name: 'PostgreSQL', alsoChange: 'DATABASE_URL and DATABASE_URL_TEST' },
  { port: 6380, name: 'Redis', alsoChange: 'REDIS_URL and REDIS_URL_TEST' },
  { port: 1025, name: 'Mailpit email server (also the default for MailHog)', alsoChange: 'SMTP_PORT' },
  { port: 8025, name: 'Mailpit inbox page (also the default for MailHog)', alsoChange: null },
]
// Ports used later by `npm run dev`
const APP_PORTS = [
  { port: 4000, name: 'the API' },
  { port: 5173, name: 'the web app, also the default for any Vite project' },
]

// Is another program already using this port on this computer?
// Two checks, one after the other: can we open the port ourselves, and does anything answer on it?
// (Either one alone can miss a program on some systems.)
function canListen(port) {
  return new Promise((resolve) => {
    const server = net.createServer()
    server.once('error', () => resolve(false))
    server.once('listening', () => server.close(() => resolve(true)))
    server.listen(port, '127.0.0.1')
  })
}
function somethingAnswers(port, host) {
  return new Promise((resolve) => {
    const socket = net.connect({ port, host })
    const finish = (answered) => {
      socket.destroy()
      resolve(answered)
    }
    socket.once('connect', () => finish(true))
    socket.once('error', () => finish(false))
    socket.setTimeout(500, () => finish(false))
  })
}
async function portInUse(port) {
  if (!(await canListen(port))) return true
  return (await somethingAnswers(port, '127.0.0.1')) || (await somethingAnswers(port, '::1'))
}

// Ports held by Sweety's own containers (from an earlier setup) are fine: setup reuses them.
function portsUsedBySweety() {
  try {
    const output = execSync('docker ps --filter "name=sweety-" --format "{{.Ports}}"', { encoding: 'utf8' })
    return new Set([...output.matchAll(/:(\d+)->/g)].map((match) => Number(match[1])))
  } catch {
    return new Set()
  }
}

// 1. Check the tools we need are installed
step(1, 'Checking Node.js, Docker and ports')
const nodeMajor = Number(process.versions.node.split('.')[0])
if (nodeMajor < 20) fail(`Node.js 20 or newer is needed (you have ${process.versions.node}).`)
try {
  execSync('docker compose version', { stdio: 'ignore' })
} catch {
  fail('Docker with "docker compose" is needed. Install Docker Desktop, start it, then run npm run setup again.')
}
console.log(`✔ Node ${process.versions.node} and Docker found`)

const ours = portsUsedBySweety()
const busy = []
for (const { port, name, alsoChange } of DOCKER_PORTS) {
  if (!ours.has(port) && (await portInUse(port))) {
    const tip = alsoChange ? `, then update ${alsoChange} in server/.env to match` : ''
    busy.push(`  • ${port}  ${name}\n      to move it: change "127.0.0.1:${port}:" in docker-compose.yml${tip}`)
  }
}
if (busy.length > 0) {
  fail(`These ports are needed by Sweety but another program is already using them:
${busy.join('\n')}

Easiest fix: stop the other program and run npm run setup again.
(If it's another Docker container, "docker ps" lists them and "docker stop <name>" stops one.)`)
}
for (const { port, name } of APP_PORTS) {
  if (await portInUse(port)) {
    console.warn(`⚠ Port ${port} (${name}) is in use. If that's Sweety's own "npm run dev", ignore this.
  Otherwise stop the other program before running "npm run dev".`)
  }
}
console.log('✔ Ports checked')

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
