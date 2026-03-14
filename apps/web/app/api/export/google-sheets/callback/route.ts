import { sheets } from '@googleapis/sheets'
import { Google } from 'arctic'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { env } from '@/env'

export async function GET(request: Request) {
	const { searchParams, origin } = new URL(request.url)
	const code = searchParams.get('code')
	const state = searchParams.get('state')

	const cookieStore = await cookies()
	const storedState = cookieStore.get('export_oauth_state')?.value
	const codeVerifier = cookieStore.get('export_code_verifier')?.value
	const exportPendingRaw = cookieStore.get('export_pending')?.value

	// Clear export cookies regardless of outcome
	cookieStore.delete('export_oauth_state')
	cookieStore.delete('export_code_verifier')
	cookieStore.delete('export_pending')

	if (!code || !state || !storedState || !codeVerifier || state !== storedState || !exportPendingRaw) {
		return NextResponse.redirect(`${origin}/create?error=export_failed`)
	}

	if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
		return NextResponse.redirect(`${origin}/create?error=google_not_configured`)
	}

	try {
		const google = new Google(
			env.GOOGLE_CLIENT_ID,
			env.GOOGLE_CLIENT_SECRET,
			`${origin}/api/export/google-sheets/callback`,
		)

		const tokens = await google.validateAuthorizationCode(code, codeVerifier)
		const accessToken = tokens.accessToken()

		const exportData = JSON.parse(exportPendingRaw) as {
			title?: string
			columns?: { id: string; label: string }[]
			rows?: Record<string, string>[]
		}

		const { title = 'Meli Export', columns = [], rows = [] } = exportData

		const sheetsClient = sheets({
			version: 'v4',
			headers: { Authorization: `Bearer ${accessToken}` },
		})

		// Build values: header row + data rows
		const headerRow = columns.map((col) => col.label)
		const dataRows = rows.map((row) => columns.map((col) => row[col.id] ?? ''))
		const values = [headerRow, ...dataRows]

		const response = await sheetsClient.spreadsheets.create({
			requestBody: {
				properties: { title },
				sheets: [
					{
						data: [
							{
								startRow: 0,
								startColumn: 0,
								rowData: values.map((rowValues) => ({
									values: rowValues.map((cell) => ({
										userEnteredValue: { stringValue: cell },
									})),
								})),
							},
						],
					},
				],
			},
		})

		const spreadsheetId = response.data.spreadsheetId
		if (!spreadsheetId) {
			return NextResponse.redirect(`${origin}/create?error=sheet_creation_failed`)
		}

		const sheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`
		return NextResponse.redirect(sheetUrl)
	} catch {
		return NextResponse.redirect(`${origin}/create?error=export_failed`)
	}
}
