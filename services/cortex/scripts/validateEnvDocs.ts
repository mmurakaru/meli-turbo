import { readFileSync } from 'node:fs'
import { renderEnvironmentVariableDocs } from './render-env-docs.ts'

const expected = renderEnvironmentVariableDocs()
const actual = readFileSync('docs/environment-variables.md', 'utf8')

if (actual !== expected) {
  console.error(
    'docs/environment-variables.md is out of date with src/runtime/config.ts - run `node --run docs:generate`',
  )
  process.exit(1)
}
console.log('docs/environment-variables.md is up to date')
