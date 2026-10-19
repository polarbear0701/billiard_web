import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom"
import { LoginPage, Dashboard, Tables, Stock, Invoices, AuditLog } from "./pages"
import PageLayout from "./components/PageLayout"
import type { ReactNode } from "react"
import { hasActiveSession, isAdminUser } from "./services/auth"

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
          <Route path="/dashboard" element={<AdminOnly><Dashboard/></AdminOnly>}/>
          <Route path="/table" element={<Tables/>}/>
          <Route path="/stock" element={<Stock/>}/>
          <Route path="/invoices" element={<Invoices/>}/>
          <Route path="/audit" element={<AdminOnly><AuditLog/></AdminOnly>}/>
        </Route>

        <Route path="*" element={<Navigate to="/table" replace/>}/>
      </Routes>
    </BrowserRouter>
  )
}

// Staff accounts have no access to the dashboard or the audit log.
function AdminOnly ({children}: {children: ReactNode}) {
  return isAdminUser() ? children : <Navigate to="/table" replace/>
}

function ProtectedRoute ({children}: {children: ReactNode}) {
  // A dead session (refresh token missing or expired) sends the user to the login page.
  // Anything the local check cannot see is caught by the 401 handling in services/http.ts.
  return hasActiveSession() ? children : <Navigate to="/login" replace/>
}

export default App
