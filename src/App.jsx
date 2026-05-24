import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import Home from './pages/public/Home'
import About from './pages/public/About'
import Services from './pages/public/Services'
import Contact from './pages/public/Contact'
import Help from './pages/public/Help'
import './App.css'

function AppLayout () {
  const navigate = useNavigate()
  return (
    <main className='main-content'>
      <Header onActionClick={() => navigate('/login')} />
      <div className='content-inner'>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/about' element={<About />} />
          <Route path='/services' element={<Services />} />
          <Route path='/contact' element={<Contact />} />
          <Route path='/help' element={<Help />} />
          {/* Placeholder for login */}
          <Route path='/login' element={<div style={{ padding: '100px', textAlign: 'center' }}><h2>Page de connexion en construction...</h2></div>} />
        </Routes>
      </div>
      <Footer />
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
