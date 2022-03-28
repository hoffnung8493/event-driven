import React, { createContext, useEffect, useState } from 'react'
import axios from 'axios'
import Header from '../components/Header'

export const BackendConnectionContext = createContext(
  {} as {
    title: string
    setTitle: React.Dispatch<React.SetStateAction<string>>
    backendUrl: string
    setBackendUrl: React.Dispatch<React.SetStateAction<string>>
  }
)

export const BackendConnectionProvider = ({ children }: { children: React.ReactNode }) => {
  const [title, setTitle] = useState('')
  const [backendUrl, setBackendUrl] = useState(localStorage.getItem('backend-url') ?? 'http://localhost:4000/event-manager/api')
  useEffect(() => {
    axios.defaults.baseURL = backendUrl
    localStorage.setItem('backend-url', backendUrl)
  }, [backendUrl])
  return (
    <BackendConnectionContext.Provider value={{ title, setTitle, backendUrl, setBackendUrl }}>
      <Header title={title} />
      {children}
    </BackendConnectionContext.Provider>
  )
}
