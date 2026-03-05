import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
// 1. Importamos el componente Login
import Login from './frontend/src/components/Login' 

function App() {
  const [count, setCount] = useState(0)
  // 2. Creamos un estado para saber si mostrar el Login o no
  const [showLogin, setShowLogin] = useState(false)

  // 3. Si showLogin es true, mostramos el componente Login
  if (showLogin) {
    return <Login />
  }

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite xd React</h1>
      
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        
        {/* 4. Botón para cambiar al Login */}
        <button 
          onClick={() => setShowLogin(true)} 
          style={{ marginLeft: '10px', backgroundColor: '#646cff' }}
        >
          Ir a Login
        </button>

        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App