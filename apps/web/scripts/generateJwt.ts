import { readFileSync } from 'node:fs'
import path from 'node:path'

import { createSigner, createVerifier } from 'fast-jwt'

import { getRootDirectory } from './utils/pathUtils'

const privateKey = readFileSync(
	`${path.join(getRootDirectory(), 'scripts', 'keys')}/jwtRS256.key`,
	'utf8',
)
const publicKey = readFileSync(
	`${path.join(getRootDirectory(), 'scripts', 'keys')}/jwtRS256.key.pub`,
	'utf8',
)

const sign = createSigner({ algorithm: 'RS256', key: privateKey })
const verify = createVerifier({ key: publicKey })

const token = sign({ claim: 'value' })
// biome-ignore lint/suspicious/noConsole: Expected
console.log(`Public key: \n${publicKey.replaceAll('\n', '||')}`)
// biome-ignore lint/suspicious/noConsole: Expected
console.log(`JWT: \n${token}`)
const payload = verify(token) as string
// biome-ignore lint/suspicious/noConsole: Expected
console.log(`Verified payload: \n${JSON.stringify(payload)}`)
