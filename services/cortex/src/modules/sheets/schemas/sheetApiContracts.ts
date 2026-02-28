import { buildRestContract } from '@lokalise/api-contracts'
import z from 'zod/v4'
import {
  GenerateSheetRequestSchema,
  GenerateSheetResponseSchema,
  SheetJobResultSchema,
} from './sheetSchemas.ts'

const JOB_ID_PARAMS = z.object({
  jobId: z.string().describe('Sheet generation job ID'),
})

export const postGenerateSheetContract = buildRestContract({
  method: 'post',
  successResponseBodySchema: GenerateSheetResponseSchema,
  requestBodySchema: GenerateSheetRequestSchema,
  pathResolver: () => '/sheets/generate',
  description: 'Enqueue a sheet generation job from a natural language prompt',
})

export const getSheetJobContract = buildRestContract({
  method: 'get',
  successResponseBodySchema: SheetJobResultSchema,
  requestPathParamsSchema: JOB_ID_PARAMS,
  pathResolver: (params) => `/sheets/jobs/${params.jobId}`,
  description: 'Poll the status and result of a sheet generation job',
})
