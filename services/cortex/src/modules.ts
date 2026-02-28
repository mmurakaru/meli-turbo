import type { AbstractModule } from 'opinionated-machine'
import { CommonModule } from './infrastructure/CommonModule.ts'
import { SheetModule } from './modules/sheets/SheetModule.ts'

export const ALL_MODULES: readonly AbstractModule<unknown>[] = [
  new CommonModule(),
  new SheetModule(),
]
