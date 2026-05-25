import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/public/Home'
import About from './pages/public/About'
import Services from './pages/public/Services'
import Contact from './pages/public/Contact'
import Help from './pages/public/Help'
import Layout from './pages/public/Layout'
import './App.css'

function AppLayout () {
  return (
    <main className='main-content'>
      <div className='content-inner'>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/about' element={<About />} />
          <Route path='/services' element={<Services />} />
          <Route path='/contact' element={<Contact />} />
          <Route path='/help' element={<Help />} />
          <Route path='/dashboard' element={<Layout />} />
          <Route path='/login' element={<div style={{ padding: '100px', textAlign: 'center' }}><h2>Page de connexion en construction...</h2></div>} />
        </Routes>
      </div>
    </main>
  )
}

function App () {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  )
}

export default App
