import { writeFileSync } from 'node:fs'
import { renderEnvironmentVariableDocs } from './render-env-docs.ts'

writeFileSync('docs/environment-variables.md', renderEnvironmentVariableDocs())
console.log('docs/environment-variables.md regenerated')
