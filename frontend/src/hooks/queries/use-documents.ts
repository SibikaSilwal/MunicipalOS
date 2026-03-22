import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export function useUploadDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      applicationId,
      documentName,
      file,
    }: {
      applicationId: string
      documentName: string
      file: File
    }) => {
      const formData = new FormData()
      formData.append('applicationId', applicationId)
      formData.append('documentName', documentName)
      formData.append('file', file)
      return api
        .post<{ id: string; documentName: string; filePath: string }>(
          '/documents/upload',
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } },
        )
        .then((r) => r.data)
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['applications', variables.applicationId],
      })
    },
  })
}
