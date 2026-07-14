#!/usr/bin/env node
/**
 * DriveHub API load test (autocannon).
 *
 * Run (server must be up):
 *   npm run test:perf
 *
 * Env:
 *   BASE_URL          — default http://localhost:3000/api/v1
 *   LOAD_CONNECTIONS  — concurrent connections (default 50; use 500 on staging)
 *   LOAD_DURATION     — seconds per endpoint (default 10)
 *
 * Local dev targets (guidance, not CI gate):
 *   p99 latency ≤ 3000 ms on /health and public reads
 *   no error rate under moderate load
 *
 * CI: skip with SKIP_PERF_TEST=1
 */
const autocannon = require('autocannon')

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000/api/v1'
const CONNECTIONS = Number(process.env.LOAD_CONNECTIONS || 50)
const DURATION = Number(process.env.LOAD_DURATION || 10)
const TARGET_P99_MS = 3000

if (process.env.SKIP_PERF_TEST === '1') {
  console.log('SKIP_PERF_TEST=1 — performance test skipped')
  process.exit(0)
}

const endpoints = [
  { path: '/health', label: 'Health' },
  { path: '/licenses', label: 'Licenses (public)' },
  { path: '/schools/map?lat=33.5138&lng=36.2765', label: 'Schools map (public)' },
]

async function runScenario({ path, label }) {
  const url = `${BASE_URL}${path}`
  console.log(`\n▶ ${label}: ${CONNECTIONS} connections × ${DURATION}s → ${url}`)

  const result = await autocannon({
    url,
    connections: CONNECTIONS,
    duration: DURATION,
    pipelining: 1,
  })

  autocannon.printResult(result, { renderResultsTable: true, renderLatencyTable: true })

  const { mean: avgMs, p99 } = result.latency
  const errRate = result.errors / (result.requests.total || 1)
  const rps = result.requests.average

  console.log(`Summary: avg=${avgMs}ms p99=${p99}ms rps=${rps.toFixed(1)} errors=${result.errors}`)

  if (p99 > TARGET_P99_MS) {
    console.warn(`⚠ p99 ${p99}ms exceeds ${TARGET_P99_MS}ms target for ${label}`)
  }
  if (errRate > 0.01) {
    console.warn(`⚠ error rate ${(errRate * 100).toFixed(2)}% for ${label}`)
  }

  return result
}

async function main() {
  console.log(`DriveHub load test — BASE_URL=${BASE_URL}`)

  for (const scenario of endpoints) {
    await runScenario(scenario)
  }

  console.log('\nDone. For production-scale (500+ users), run on staging with LOAD_CONNECTIONS=500.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
