import { createHash } from 'node:crypto'
import { readFileSync, statSync, existsSync } from 'node:fs'
import { join, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const releaseDir = join(root, 'release')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))

const failures = []
const pass = (message) => console.log(`ok - ${message}`)
const fail = (message) => {
  failures.push(message)
  console.error(`not ok - ${message}`)
}

const tag = process.argv.find((arg) => arg.startsWith('--tag='))?.slice('--tag='.length)
const checkWindows = process.argv.includes('--windows')

function requireFile(path) {
  if (!existsSync(path)) {
    fail(`falta ${path}`)
    return null
  }
  return statSync(path)
}

function readYaml(path) {
  if (!existsSync(path)) {
    fail(`falta ${path}`)
    return ''
  }
  return readFileSync(path, 'utf8')
}

function yamlValue(text, key) {
  const match = text.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))
  return match?.[1].trim().replace(/^['"]|['"]$/g, '')
}

if (tag && tag.replace(/^v/, '') !== pkg.version) {
  fail(`el tag ${tag} no coincide con package.json (${pkg.version})`)
} else if (tag) {
  pass(`tag ${tag} coincide con la versión ${pkg.version}`)
}

if (checkWindows) {
  const installerPath = join(releaseDir, 'App-LOL-Setup-x64.exe')
  const blockmapPath = `${installerPath}.blockmap`
  const portablePath = join(releaseDir, 'App-LOL-Portable-x64.exe')
  const latestPath = join(releaseDir, 'latest.yml')
  const appPath = join(releaseDir, 'win-unpacked', 'App-LOL.exe')
  const asarPath = join(releaseDir, 'win-unpacked', 'resources', 'app.asar')
  const updateConfigPath = join(releaseDir, 'win-unpacked', 'resources', 'app-update.yml')

  const installer = requireFile(installerPath)
  requireFile(blockmapPath)
  requireFile(portablePath)
  const app = requireFile(appPath)
  requireFile(asarPath)

  if (app) pass('incluye el ejecutable y app.asar')

  const latest = readYaml(latestPath)
  if (latest) {
    const version = yamlValue(latest, 'version')
    const file = yamlValue(latest, 'path')
    const size = Number(yamlValue(latest, 'size'))
    const sha512 = yamlValue(latest, 'sha512')
    const fileEntry = file
      ? latest.match(
          new RegExp(
            `- url:\\s*${file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$[\\s\\S]*?size:\\s*(\\d+)`,
            'm'
          )
        )
      : null
    const expectedSize = Number.isFinite(size) ? size : Number(fileEntry?.[1])

    if (version !== pkg.version) fail(`latest.yml apunta a ${version}, se esperaba ${pkg.version}`)
    else pass(`latest.yml apunta a ${pkg.version}`)

    if (file !== 'App-LOL-Setup-x64.exe') fail(`latest.yml usa el archivo ${file}`)
    else pass('latest.yml usa el instalador NSIS')

    if (!installer) {
      fail('no se puede verificar el hash sin instalador')
    } else {
      if (expectedSize !== installer.size) {
        fail(`tamaño en latest.yml ${expectedSize} != ${installer.size}`)
      } else {
        pass('el tamaño del instalador coincide con latest.yml')
      }

      const hash = createHash('sha512').update(readFileSync(installerPath)).digest('base64')
      if (sha512 !== hash) fail('el sha512 del instalador no coincide con latest.yml')
      else pass('el sha512 del instalador coincide con latest.yml')
    }
  }

  const updateConfig = readYaml(updateConfigPath)
  if (updateConfig) {
    const provider = yamlValue(updateConfig, 'provider')
    const owner = yamlValue(updateConfig, 'owner')
    const repo = yamlValue(updateConfig, 'repo')
    if (provider !== 'github' || !owner || !repo) {
      fail('app-update.yml no contiene un feed de GitHub válido')
    } else {
      pass(`updater configurado para ${owner}/${repo}`)
    }
  }
}

if (failures.length > 0) {
  console.error(`\n${failures.length} comprobación(es) fallida(s)`)
  process.exit(1)
}

console.log('\nArtefactos verificados correctamente')
