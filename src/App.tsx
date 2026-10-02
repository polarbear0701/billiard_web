import { BrowserRouter, Route, Routes } from "react-router-dom"
import { LoginPage, Dashboard } from "./pages"


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage/>}/>
        <Route path="/dashboard" element={<Dashboard/>}/>
      </Routes>
    </BrowserRouter>
  )
}

export default App
