import { useCallback, useState } from 'react'
import axios, { AxiosResponse, Method } from 'axios'

function useLazyQuery<T>(method: Method, url: string) {
  const [data, setData] = useState<AxiosResponse<T>['data']>()
  const [error, setError] = useState<string>()
  const [loading, setLoading] = useState(false)

  const query = useCallback(() => {
    if (!method) return
    const fetchData = async () => {
      try {
        const response = await axios({
          method,
          url,
        })
        setData(response.data)
      } catch (error) {
        console.error(error)
        if (error instanceof Error) setError(error.message)
      }
      setLoading(false)
    }

    fetchData()
  }, [method, url])

  return {
    data,
    loading,
    error,
    query,
  }
}

export default useLazyQuery
