import React, { createContext, useEffect, useState } from 'react'
import axios from 'axios'

export const BackendConnectionContext = createContext(
  {} as { backendUrl: string; setBackendUrl: React.Dispatch<React.SetStateAction<string>> }
)

export const BackendConnectionProvider = ({ children }: { children: React.ReactNode }) => {
  const [backendUrl, setBackendUrl] = useState(localStorage.getItem('backend-url') ?? 'http://localhost:4000/event-api')
  useEffect(() => {
    axios.defaults.baseURL = backendUrl
    localStorage.setItem('backend-url', backendUrl)
  }, [backendUrl])
  return <BackendConnectionContext.Provider value={{ backendUrl, setBackendUrl }}>{children}</BackendConnectionContext.Provider>
}
