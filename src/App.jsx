import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import './App.css'

function App () {
  return (

    <main className='main-content'>
      <Header />

      <div className='content-inner'>
        <div className='component-section'>
          <h2 className='handwritten-title'>
            Des <span className='handwritten-highlight'>questions ?</span>
          </h2>
        </div>
      </div>

      <Footer />
    </main>

  )
}

export default App
