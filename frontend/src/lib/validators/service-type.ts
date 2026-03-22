import { z } from 'zod'

export const createServiceTypeSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  municipalityId: z.string().min(1, 'Please select a municipality'),
  requiredDocuments: z.array(
    z.object({
      name: z.string().min(1, 'Document name is required'),
      required: z.boolean(),
    }),
  ),
})

export type CreateServiceTypeValues = z.infer<typeof createServiceTypeSchema>
