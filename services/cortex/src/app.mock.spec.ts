import { asServiceClass } from 'opinionated-machine'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { AppInstance } from './app.ts'
import { getApp } from './app.ts'
import type { Dependencies } from './infrastructure/CommonModule.ts'
import { SheetService } from './modules/sheets/services/SheetService.ts'

class FakeSheetService extends SheetService {
  constructor() {
    super({} as Dependencies)
  }

  override generateSheet(): Promise<{ columns: []; rows: [] }> {
    return Promise.resolve({ columns: [], rows: [] })
  }
}

describe('dependency mocking', () => {
  let app: AppInstance
  beforeAll(async () => {
    app = await getApp(
      {},
      {
        sheetService: asServiceClass(FakeSheetService),
      },
    )
  })

  afterAll(async () => {
    await app.close()
  })

  it('uses mock implementation', async () => {
    const { sheetService } = app.diContainer.cradle

    const result = await sheetService.generateSheet('test')

    expect(result.columns).toEqual([])
  })
})
