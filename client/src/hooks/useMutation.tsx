import { useCallback, useState } from 'react'
import axios, { Method, AxiosResponse } from 'axios'

function useMutation<T>(method: Method, url: string) {
  const [data, setData] = useState<AxiosResponse<T>['data']>()
  const [error, setError] = useState<string>()
  const [loading, setLoading] = useState(false)
  const mutate = useCallback(
    async (body: any) => {
      try {
        setLoading(true)
        setError(undefined)
        const { data: response } = await axios({
          method,
          url,
          data: body,
        })
        setData(response)
      } catch (error) {
        console.log({ error })
        if (axios.isAxiosError(error)) setError(error.response?.data)
        else if (error instanceof Error) setError(error.message)
      }
      setLoading(false)
    },
    [method, url]
  )

  return {
    data,
    loading,
    error,
    mutate,
  }
}

export default useMutation
