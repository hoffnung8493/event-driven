import { useEffect, useState, useContext } from 'react'
import axios, { AxiosResponse, Method } from 'axios'
import { BackendConnectionContext } from '../contexts/backendConnection'

function useQuery<T>(method: Method, url: string) {
  const [data, setData] = useState<AxiosResponse<T>['data']>()
  const [error, setError] = useState<string>()
  const [loading, setLoading] = useState(false)
  const { backendUrl } = useContext(BackendConnectionContext)

  useEffect(() => {
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
    setTimeout(() => {
      fetchData()
    }, 0)
  }, [method, url, backendUrl])

  return {
    data,
    loading,
    error,
  }
}

export default useQuery
