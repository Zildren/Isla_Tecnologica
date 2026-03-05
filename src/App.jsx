import { useState } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom' // Importamos las herramientas
import Login from './Login' // Asegúrate de que el archivo exista
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function Home() {
  const [count, setCount] = useState(0)
  const navigate = useNavigate() // El "volante" para movernos

  return (
    <>
      <div>
        <img src={viteLogo} className="logo" alt="Vite logo" />
        <img src={reactLogo} className="logo react" alt="React logo" />
      </div>
      <h1>Vite xd React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <br /><br />
        
        {/* BOTÓN PARA IR AL LOGIN */}
        <button onClick={() => navigate('/login')} style={{ backgroundColor: '#646cff' }}>
          Ir al Login
        </button>

      </div>
    </>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
    </Routes>
  )
}

export default Appgit add .