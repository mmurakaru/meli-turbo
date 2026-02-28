import { exec } from 'node:child_process'
import crypto from 'node:crypto'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import readline from 'node:readline'
import { promisify } from 'node:util'

const execAsync = promisify(exec)

function question(query: string): Promise<string> {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	})

	return new Promise((resolve) =>
		rl.question(query, (ans) => {
			rl.close()
			resolve(ans)
		}),
	)
}

async function checkDocker() {
	console.log('\nStep 1: Checking Docker...')
	try {
		await execAsync('docker --version')
		console.log('✓ Docker is installed.')
	} catch {
		console.error(
			'✗ Docker is not installed. Please install it from https://docs.docker.com/get-docker/ and try again.',
		)
		process.exit(1)
	}
}

async function startDatabase() {
	console.log('\nStep 2: Starting Postgres...')
	try {
		await execAsync('docker compose up -d')
		console.log('✓ Postgres started on port 54322.')
	} catch (error) {
		console.error('✗ Failed to start Postgres.', error)
		process.exit(1)
	}
}

async function writeEnvFile() {
	console.log('\nStep 3: Setting up environment variables...')

	const envPath = path.join(process.cwd(), '.env.local')

	try {
		await fs.access(envPath)
		const overwrite = await question('.env.local already exists. Overwrite? (y/N): ')
		if (overwrite.toLowerCase() !== 'y') {
			console.log('Skipping .env.local setup.')
			return
		}
	} catch {
		// file doesn't exist, proceed
	}

	const sessionSecret = crypto.randomBytes(32).toString('base64')

	const postgresUrl = await question(
		'POSTGRES_URL [postgres://postgres:postgres@localhost:54322/postgres]: ',
	)
	const baseUrl = await question('BASE_URL [http://localhost:3000]: ')
	const googleClientId = await question('GOOGLE_CLIENT_ID (leave blank to skip): ')
	const googleClientSecret = googleClientId ? await question('GOOGLE_CLIENT_SECRET: ') : ''
	const stripeSecretKey = await question('STRIPE_SECRET_KEY (leave blank to skip): ')
	const stripeWebhookSecret = stripeSecretKey
		? await question('STRIPE_WEBHOOK_SECRET (leave blank, set after running stripe listen): ')
		: ''

	const envContent = [
		`# Database`,
		`POSTGRES_URL=${postgresUrl || 'postgres://postgres:postgres@localhost:54322/postgres'}`,
		``,
		`# App`,
		`BASE_URL=${baseUrl || 'http://localhost:3000'}`,
		``,
		`# Session`,
		`SESSION_SECRET=${sessionSecret}`,
		``,
		...(googleClientId
			? [
					`# Google OAuth`,
					`GOOGLE_CLIENT_ID=${googleClientId}`,
					`GOOGLE_CLIENT_SECRET=${googleClientSecret}`,
					``,
				]
			: []),
		...(stripeSecretKey
			? [
					`# Stripe`,
					`STRIPE_SECRET_KEY=${stripeSecretKey}`,
					`STRIPE_WEBHOOK_SECRET=${stripeWebhookSecret}`,
					``,
				]
			: []),
	].join('\n')

	await fs.writeFile(envPath, envContent)
	console.log('✓ .env.local created.')
	console.log(`✓ SESSION_SECRET generated automatically.`)
}

async function runMigrations() {
	console.log('\nStep 4: Running database migrations...')
	try {
		const { stdout, stderr } = await execAsync('pnpm db:migrate')
		if (stdout) console.log(stdout)
		if (stderr) console.log(stderr)
		console.log('✓ Migrations applied.')
	} catch (error) {
		console.error('✗ Migrations failed.', error)
		process.exit(1)
	}
}

async function runSeed() {
	console.log('\nStep 5: Seeding database...')
	try {
		const { stdout } = await execAsync('pnpm db:seed')
		if (stdout) console.log(stdout)
		console.log('✓ Database seeded.')
		console.log('  Email:    test@test.com')
		console.log('  Password: admin123')
	} catch (error) {
		console.error('✗ Seed failed.', error)
		process.exit(1)
	}
}

async function setupStripe() {
	console.log('\nStep 6: Stripe setup (optional)')
	const answer = await question('Set up Stripe products and prices? (y/N): ')
	if (answer.toLowerCase() !== 'y') {
		console.log('Skipping Stripe setup. Run `pnpm stripe:setup` later when ready.')
		return
	}

	try {
		const { stdout } = await execAsync('pnpm stripe:setup')
		if (stdout) console.log(stdout)
		console.log('✓ Stripe products and prices created.')
	} catch (error) {
		console.error('✗ Stripe setup failed.', error)
	}
}

async function main() {
	console.log('🚀 Meli setup\n')

	await checkDocker()
	await startDatabase()
	await writeEnvFile()
	await runMigrations()
	await runSeed()
	await setupStripe()

	console.log('\n✓ Setup complete!')
	console.log('  Run `pnpm dev` from the monorepo root to start the app.')
	console.log(
		'  Run `stripe listen --forward-to localhost:3000/api/stripe/webhook` to forward webhooks.\n',
	)
}

main().catch(console.error)
