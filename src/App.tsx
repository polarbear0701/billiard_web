import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom"
import { LoginPage, Dashboard, Tables } from "./pages"
import PageLayout from "./components/PageLayout"
import type { ReactNode } from "react"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage/>}/>
        
        <Route path="/" element={
          <ProtectedRoute>
            <PageLayout/>
          </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard/>}/>
          <Route path="/table" element={<Tables/>}/>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

function ProtectedRoute ({children}: {children: ReactNode}) {
  const token = localStorage.getItem("accessToken")
  return token ? children: <Navigate to="/login" replace/>
}

export default App
