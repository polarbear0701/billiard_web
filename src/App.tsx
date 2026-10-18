import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom"
import { LoginPage, Dashboard, Tables, Stock, Invoices } from "./pages"
import PageLayout from "./components/PageLayout"
import type { ReactNode } from "react"
import { hasActiveSession } from "./services/auth"

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
          <Route index element={<Navigate to="/table" replace/>}/>
          <Route path="/dashboard" element={<Dashboard/>}/>
          <Route path="/table" element={<Tables/>}/>
          <Route path="/stock" element={<Stock/>}/>
          <Route path="/invoices" element={<Invoices/>}/>
        </Route>

        <Route path="*" element={<Navigate to="/table" replace/>}/>
      </Routes>
    </BrowserRouter>
  )
}

function ProtectedRoute ({children}: {children: ReactNode}) {
  return hasActiveSession() ? children : <Navigate to="/login" replace/>
}

export default App
