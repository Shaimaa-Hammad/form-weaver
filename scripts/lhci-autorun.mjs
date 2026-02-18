import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { cp, mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'

const THRESHOLDS = {
  performance: 0.9,
  accessibility: 0.95,
  'best-practices': 0.95,
  seo: 0.9,
}

const npmCliCandidates = [
  process.env.npm_execpath,
  resolve(dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js'),
  resolve(dirname(process.execPath), '..', 'lib', 'node_modules', 'npm', 'bin', 'npm-cli.js'),
]

const npmCliPath =
  npmCliCandidates.find(
    (candidate) =>
      typeof candidate === 'string' &&
      candidate.toLowerCase().endsWith('.js') &&
      existsSync(candidate),
  ) ?? null

function runCommand(command, args, options = {}) {
  return new Promise((resolvePromise) => {
    let output = ''

    let child
    try {
      child = spawn(command, args, {
        env: options.env ?? process.env,
        shell: options.shell ?? false,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      resolvePromise({ code: 1, output: `${message}\n` })
      return
    }

    child.stdout.on('data', (chunk) => {
      const text = chunk.toString()
      output += text
      process.stdout.write(text)
    })

    child.stderr.on('data', (chunk) => {
      const text = chunk.toString()
      output += text
      process.stderr.write(text)
    })

    child.on('close', (code) => {
      resolvePromise({ code: code ?? 1, output })
    })

    child.on('error', (error) => {
      output += `${error.message}\n`
      resolvePromise({ code: 1, output })
    })
  })
}

function isSpawnInvalidArgument(output) {
  return /spawn EINVAL/i.test(output)
}

async function runNpm(args, options = {}) {
  if (npmCliPath) {
    const result = await runCommand(process.execPath, [npmCliPath, ...args], options)
    if (result.code === 0 || !isSpawnInvalidArgument(result.output)) {
      return result
    }
  }

  if (process.platform === 'win32') {
    // Fallback for uncommon environments where npm-cli.js could not be discovered.
    return runCommand('npm.cmd', args, { ...options, shell: true })
  }

  return runCommand('npm', args, options)
}

function spawnNpm(args, options = {}) {
  const spawnOptions = {
    env: options.env ?? process.env,
    stdio: options.stdio ?? 'pipe',
    shell: options.shell ?? false,
  }

  if (npmCliPath) {
    return spawn(process.execPath, [npmCliPath, ...args], spawnOptions)
  }

  if (process.platform === 'win32') {
    return spawn('npm.cmd', args, { ...spawnOptions, shell: true })
  }

  return spawn('npm', args, spawnOptions)
}

function collectThresholdFailures(lhr) {
  const failures = []
  for (const [category, minScore] of Object.entries(THRESHOLDS)) {
    const score = lhr.categories?.[category]?.score
    if (typeof score !== 'number') {
      failures.push(`${category}: missing score`)
      continue
    }

    if (score < minScore) {
      failures.push(`${category}: ${(score * 100).toFixed(0)} < ${(minScore * 100).toFixed(0)}`)
    }
  }

  return failures
}

async function waitForServer(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url)
      if (response.ok) {
        return
      }
    } catch {
      // Ignore and retry.
    }

    await delay(250)
  }

  throw new Error(`Timed out waiting for preview server at ${url}.`)
}

async function stopProcessTree(child) {
  if (!child || child.killed) {
    return
  }

  child.kill()
  await delay(400)

  if (child.exitCode !== null) {
    return
  }

  if (process.platform === 'win32' && child.pid) {
    await runCommand('taskkill', ['/pid', String(child.pid), '/T', '/F'])
    return
  }

  child.kill('SIGKILL')
}

async function runDirectLighthouseFallback() {
  const localTempDir = resolve('.lighthouseci/tmp')
  const fallbackBase = resolve('lhci_reports', `recovered-${Date.now()}`)

  let previewProcess = null

  try {
    previewProcess = spawnNpm(['run', 'preview'], {
      env: {
        ...process.env,
        TEMP: localTempDir,
        TMP: localTempDir,
        TMPDIR: localTempDir,
      },
    })

    previewProcess.stdout?.on('data', (chunk) => process.stdout.write(chunk.toString()))
    previewProcess.stderr?.on('data', (chunk) => process.stderr.write(chunk.toString()))

    await waitForServer('http://localhost:4173/', 25000)

    const lighthouseResult = await runNpm(
      [
        'exec',
        '--',
        'lighthouse',
        'http://localhost:4173/',
        '--preset=desktop',
        '--output=html',
        '--output=json',
        `--output-path=${fallbackBase}`,
        '--chrome-flags=--headless --disable-gpu --no-sandbox --user-data-dir=.lighthouseci/chrome-profile-fallback',
      ],
      {
        env: {
          ...process.env,
          TEMP: localTempDir,
          TMP: localTempDir,
          TMPDIR: localTempDir,
        },
      },
    )

    const fallbackJsonPath = `${fallbackBase}.json`
    const fallbackHtmlPath = `${fallbackBase}.html`
    if (!existsSync(fallbackJsonPath) || !existsSync(fallbackHtmlPath)) {
      throw new Error(
        `Direct Lighthouse fallback did not produce output files.\n${lighthouseResult.output}`,
      )
    }

    const jsonText = await readFile(fallbackJsonPath, 'utf8')
    const lhr = JSON.parse(jsonText)

    await writeLatestReportFiles({
      lhr,
      jsonPath: fallbackJsonPath,
      htmlPath: fallbackHtmlPath,
    })

    const failures = collectThresholdFailures(lhr)
    if (failures.length) {
      throw new Error(
        `Lighthouse thresholds failed in direct fallback run:\n- ${failures.join('\n- ')}`,
      )
    }
  } finally {
    await stopProcessTree(previewProcess)
  }
}

function looksLikeWindowsTempCleanupError(output) {
  return (
    /Runtime error encountered:\s*EPERM, Permission denied/i.test(output) &&
    /lighthouse\.[0-9]+/i.test(output)
  )
}

async function findLatestLhrPath(extension) {
  const lhciDir = resolve('.lighthouseci')
  const files = await readdir(lhciDir, { withFileTypes: true })
  const extensionPattern = extension.replace('.', '\\.')
  const candidates = files
    .filter(
      (entry) =>
        entry.isFile() && new RegExp(`^lhr-\\d+\\.${extensionPattern}$`, 'i').test(entry.name),
    )
    .map((entry) => entry.name)
    .sort()

  if (!candidates.length) {
    return null
  }

  return resolve(lhciDir, candidates[candidates.length - 1])
}

async function findLatestLhrJsonPath() {
  return findLatestLhrPath('json')
}

async function findLatestLhrHtmlPath() {
  return findLatestLhrPath('html')
}

async function findFreshLhrJsonPath(runStartedAt) {
  const latestJsonPath = await findLatestLhrJsonPath()
  if (!latestJsonPath) {
    return null
  }

  const jsonStats = await stat(latestJsonPath)
  if (jsonStats.mtimeMs < runStartedAt) {
    return null
  }

  return latestJsonPath
}

async function findFreshLhrHtmlPath(runStartedAt) {
  const latestHtmlPath = await findLatestLhrHtmlPath()
  if (!latestHtmlPath) {
    return null
  }

  const htmlStats = await stat(latestHtmlPath)
  if (htmlStats.mtimeMs < runStartedAt) {
    return null
  }

  return latestHtmlPath
}

async function findFreshManifestReport(runStartedAt) {
  const manifestPath = resolve('lhci_reports/manifest.json')
  if (!existsSync(manifestPath)) {
    return null
  }

  const manifestStats = await stat(manifestPath)
  if (manifestStats.mtimeMs < runStartedAt) {
    return null
  }

  const manifestText = await readFile(manifestPath, 'utf8')
  const manifest = JSON.parse(manifestText)

  if (!Array.isArray(manifest) || manifest.length === 0) {
    return null
  }

  const representativeReport =
    manifest.find((entry) => entry?.isRepresentativeRun) ?? manifest[manifest.length - 1]

  if (
    !representativeReport ||
    typeof representativeReport.jsonPath !== 'string' ||
    typeof representativeReport.htmlPath !== 'string'
  ) {
    return null
  }

  return {
    jsonPath: representativeReport.jsonPath,
    htmlPath: representativeReport.htmlPath,
  }
}

function stripAnsi(text) {
  return text.replace(/\u001B\[[0-?]*[ -/]*[@-~]/g, '')
}

function extractLhrFromOutput(output) {
  const cleanedOutput = stripAnsi(output)
  let searchEnd = cleanedOutput.length

  while (searchEnd > 0) {
    const anchor = cleanedOutput.lastIndexOf('"lighthouseVersion"', searchEnd)
    if (anchor === -1) {
      return null
    }

    let objectStart = cleanedOutput.lastIndexOf('{', anchor)
    while (objectStart !== -1) {
      let depth = 0
      let inString = false
      let escaped = false

      for (let i = objectStart; i < cleanedOutput.length; i += 1) {
        const char = cleanedOutput[i]

        if (inString) {
          if (escaped) {
            escaped = false
            continue
          }

          if (char === '\\') {
            escaped = true
            continue
          }

          if (char === '"') {
            inString = false
          }

          continue
        }

        if (char === '"') {
          inString = true
          continue
        }

        if (char === '{') {
          depth += 1
          continue
        }

        if (char !== '}') {
          continue
        }

        depth -= 1
        if (depth !== 0) {
          continue
        }

        const maybeJson = cleanedOutput.slice(objectStart, i + 1)
        try {
          const parsed = JSON.parse(maybeJson)
          if (parsed?.lighthouseVersion && parsed?.categories) {
            return parsed
          }
        } catch {
          // Continue searching previous object starts.
        }

        break
      }

      objectStart = cleanedOutput.lastIndexOf('{', objectStart - 1)
    }

    searchEnd = anchor - 1
  }

  return null
}

function extractLhrFromHtml(htmlText) {
  const match = htmlText.match(/window\.__LIGHTHOUSE_JSON__\s*=\s*(.*?);\s*<\/script>/s)
  if (!match) {
    return null
  }

  try {
    const parsed = JSON.parse(match[1])
    if (parsed?.lighthouseVersion && parsed?.categories) {
      return parsed
    }
  } catch {
    // Ignore parse errors and continue with other recovery sources.
  }

  return null
}

async function writeLatestReportFiles({ lhr, jsonPath, htmlPath }) {
  await mkdir(resolve('lhci_reports'), { recursive: true })

  if (jsonPath && htmlPath) {
    await cp(jsonPath, resolve('lhci_reports/latest-desktop.json'))
    await cp(htmlPath, resolve('lhci_reports/latest-desktop.html'))
    return
  }

  const { ReportGenerator } = await import('lighthouse/report/generator/report-generator.js')
  const html = ReportGenerator.generateReportHtml(lhr)

  await writeFile(resolve('lhci_reports/latest-desktop.json'), JSON.stringify(lhr, null, 2), 'utf8')
  await writeFile(resolve('lhci_reports/latest-desktop.html'), html, 'utf8')
}

async function salvageLatestReportsAndAssert({ runStartedAt, lhciOutput }) {
  let lhr = null
  let jsonPath = null
  let htmlPath = null

  const freshLhrJsonPath = await findFreshLhrJsonPath(runStartedAt)
  if (freshLhrJsonPath) {
    jsonPath = freshLhrJsonPath
    const possibleHtmlPath = freshLhrJsonPath.replace(/\.json$/i, '.html')
    if (existsSync(possibleHtmlPath)) {
      htmlPath = possibleHtmlPath
    }
  } else {
    const manifestReport = await findFreshManifestReport(runStartedAt)
    if (manifestReport) {
      jsonPath = manifestReport.jsonPath
      htmlPath = manifestReport.htmlPath
    } else {
      const freshLhrHtmlPath = await findFreshLhrHtmlPath(runStartedAt)
      if (freshLhrHtmlPath) {
        const freshHtmlText = await readFile(freshLhrHtmlPath, 'utf8')
        const parsedFromHtml = extractLhrFromHtml(freshHtmlText)
        if (parsedFromHtml) {
          lhr = parsedFromHtml
        } else {
          process.stderr.write(
            'Warning: fresh .lighthouseci HTML artifact was found but JSON extraction failed.\n',
          )
        }
      }

      if (!lhr) {
        lhr = extractLhrFromOutput(lhciOutput)
      }

      if (!lhr) {
        throw new Error(
          'No fresh Lighthouse report artifact found in .lighthouseci or lhci_reports, and no parsable LHR JSON was found in LHCI output.',
        )
      }
    }
  }

  if (!lhr) {
    const jsonText = await readFile(jsonPath, 'utf8')
    lhr = JSON.parse(jsonText)
  }

  await writeLatestReportFiles({ lhr, jsonPath, htmlPath })

  const failures = collectThresholdFailures(lhr)

  if (failures.length) {
    throw new Error(
      `Lighthouse thresholds failed after fallback report recovery:\n- ${failures.join('\n- ')}`,
    )
  }
}

async function main() {
  const buildResult = await runNpm(['run', 'build'])
  if (buildResult.code !== 0) {
    process.exit(buildResult.code)
  }

  const localTempDir = resolve('.lighthouseci/tmp')
  await mkdir(localTempDir, { recursive: true })
  const runStartedAt = Date.now()

  const lhciArgs = [
    'exec',
    '--',
    'lhci',
    'autorun',
    '--collect.url=http://localhost:4173/',
    '--collect.settings.chromeFlags=--headless --disable-gpu --no-sandbox --user-data-dir=.lighthouseci/chrome-profile',
    '--upload.target=filesystem',
    '--upload.outputDir=./lhci_reports',
  ]

  if (process.platform === 'win32') {
    // Windows cleanup flakiness is mostly observed between sequential runs.
    lhciArgs.push('--collect.numberOfRuns=1')
  }

  const lhciResult = await runNpm(lhciArgs, {
    env: {
      ...process.env,
      TEMP: localTempDir,
      TMP: localTempDir,
      TMPDIR: localTempDir,
    },
  })

  if (lhciResult.code === 0) {
    process.exit(0)
  }

  if (!looksLikeWindowsTempCleanupError(lhciResult.output)) {
    process.exit(lhciResult.code)
  }

  process.stderr.write(
    '\nDetected Windows temp cleanup EPERM after Lighthouse collection; attempting report recovery.\n',
  )

  try {
    await salvageLatestReportsAndAssert({
      runStartedAt,
      lhciOutput: lhciResult.output,
    })
    process.stderr.write(
      'Recovered latest report to lhci_reports/latest-desktop.html and latest-desktop.json.\n',
    )
    process.exit(0)
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    process.stderr.write('Attempting direct Lighthouse fallback run...\n')

    try {
      await runDirectLighthouseFallback()
      process.stderr.write(
        'Direct fallback completed and refreshed lhci_reports/latest-desktop.html and latest-desktop.json.\n',
      )
      process.exit(0)
    } catch (fallbackError) {
      process.stderr.write(
        `${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}\n`,
      )
      process.exit(1)
    }
  }
}

main()
