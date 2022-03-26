import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { theme } from './theme'
import { ThemeProvider } from '@emotion/react'
import StreamsListPage from './pages/StreamsListPage'
import StreamPage from './pages/StreamPage'
import SubjectListPage from './pages/SubjectListPage'
import RegisterPage from './pages/RegisterPage'
import SigninPage from './pages/SigninPage'
import SubjectPage from './pages/SubjectPage'
import OperationPage from './pages/OperationPage'
import { BackendConnectionProvider } from './contexts/backendConnection'

function App() {
  return (
    <ThemeProvider theme={theme}>
      <BackendConnectionProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<StreamsListPage />} />
            <Route path="/streams/:stream" element={<StreamPage />} />
            <Route path="/subjects" element={<SubjectListPage />} />
            <Route path="/subjects/:subject" element={<SubjectPage />} />
            <Route path="/operations/:operationId" element={<OperationPage />} />
            <Route path="/auth/register" element={<RegisterPage />} />
            <Route path="/auth/signin" element={<SigninPage />} />
          </Routes>
        </BrowserRouter>
      </BackendConnectionProvider>
    </ThemeProvider>
  )
}

export default App
