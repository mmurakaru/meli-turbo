import { ImageResponse } from 'next/og'
import type { NextRequest } from 'next/server'

export const runtime = 'edge'

// 1200×700 canvas (same 12:7 aspect ratio as display cards).
// Displayed at ~400px CSS wide → browser downscales ~3×, always crisp.
const W = 1200
const H = 700

export async function GET(request: NextRequest) {
	const { searchParams, origin } = new URL(request.url)
	const title = searchParams.get('title') ?? 'Untitled'
	const columnsParam = searchParams.get('columns')
	const rowsParam = searchParams.get('rows')

	type Column = { id: string; label: string }
	type Row = Record<string, string>

	let columns: Column[] = []
	let rows: Row[] = []

	try {
		if (columnsParam) columns = JSON.parse(columnsParam) as Column[]
		if (rowsParam) rows = (JSON.parse(rowsParam) as Row[]).slice(0, 5)
	} catch {
		// fallback to title-only
	}

	const [fontData, fontDataBold, logoSvg] = await Promise.all([
		fetch(`${origin}/fonts/Inter-Regular.ttf`).then((res) => res.arrayBuffer()),
		fetch(`${origin}/fonts/Inter-Bold.ttf`).then((res) => res.arrayBuffer()),
		fetch(`${origin}/icons/meli.svg`).then((res) => res.text()),
	])
	const logoSrc = `data:image/svg+xml;base64,${Buffer.from(logoSvg).toString('base64')}`

	const hasData = columns.length > 0

	return new ImageResponse(
		<div
			style={{
				width: `${W}px`,
				height: `${H}px`,
				background: '#ffffff',
				display: 'flex',
				flexDirection: 'column',
				overflow: 'hidden',
				fontFamily: 'Inter',
			}}
		>
			{hasData ? (
				<div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
					{/* Column headers */}
					<div
						style={{
							display: 'flex',
							background: '#f3f4f6',
							borderBottom: '2px solid #e5e7eb',
						}}
					>
						{columns.slice(0, 5).map((col) => (
							<div
								key={col.id}
								style={{
									flex: 1,
									padding: '20px 28px',
									fontSize: '22px',
									fontWeight: 600,
									color: '#6b7280',
									textTransform: 'uppercase',
									overflow: 'hidden',
									borderRight: '2px solid #e5e7eb',
								}}
							>
								{col.label.slice(0, 16)}
							</div>
						))}
					</div>
					{/* Data rows */}
					{rows.map((row, rowIndex) => (
						<div
							key={row[columns[0]?.id ?? ''] ?? rowIndex}
							style={{
								display: 'flex',
								background: rowIndex % 2 === 0 ? '#ffffff' : '#f9fafb',
								borderBottom: '2px solid #f3f4f6',
							}}
						>
							{columns.slice(0, 5).map((col) => (
								<div
									key={col.id}
									style={{
										flex: 1,
										padding: '20px 28px',
										fontSize: '28px',
										color: '#374151',
										overflow: 'hidden',
										borderRight: '2px solid #f3f4f6',
									}}
								>
									{(row[col.id] ?? '').slice(0, 14)}
								</div>
							))}
						</div>
					))}
				</div>
			) : (
				/* Title-only fallback with grid lines */
				<div
					style={{
						flex: 1,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						position: 'relative',
						overflow: 'hidden',
					}}
				>
					{[0, 1, 2, 3, 4].map((i) => (
						<div
							key={i}
							style={{
								position: 'absolute',
								left: `${(i + 1) * 200}px`,
								top: 0,
								bottom: 0,
								width: '2px',
								background: '#f3f4f6',
							}}
						/>
					))}
					{[0, 1, 2].map((i) => (
						<div
							key={i}
							style={{
								position: 'absolute',
								top: `${(i + 1) * 175}px`,
								left: 0,
								right: 0,
								height: '2px',
								background: '#f3f4f6',
							}}
						/>
					))}
					<span
						style={{
							fontSize: '60px',
							fontWeight: 700,
							color: '#374151',
							textAlign: 'center',
							padding: '0 96px',
						}}
					>
						{title}
					</span>
				</div>
			)}

			{/* Bottom branding bar */}
			<div
				style={{
					background: '#f9fafb',
					borderTop: '2px solid #f3f4f6',
					padding: '20px 40px',
					display: 'flex',
					alignItems: 'center',
					gap: '16px',
				}}
			>
				{/* biome-ignore lint: Satori JSX does not support next/image */}
				<img src={logoSrc} width={36} height={30} alt="" />
				<span style={{ fontSize: '32px', fontWeight: 600, color: '#111827' }}>meli</span>
			</div>
		</div>,
		{
			width: W,
			height: H,
			fonts: [
				{
					name: 'Inter',
					data: fontData,
					weight: 400,
				},
				{
					name: 'Inter',
					data: fontDataBold,
					weight: 700,
				},
			],
			headers: {
				'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
			},
		},
	)
}
