import { z } from 'zod'

export const submitApplicationSchema = z.object({
  serviceTypeId: z.string().min(1, 'Please select a service type'),
})

export type SubmitApplicationValues = z.infer<typeof submitApplicationSchema>
