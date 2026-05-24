import React from 'react'
import { Mail, Phone } from 'lucide-react'
import footerBg from '../../assets/images/footerbg.png'
import './Footer.css'

const Footer = ({ className = '', ...props }) => {
  return (
    <footer
      className={`gsemmanuel-footer ${className}`}
      style={{ backgroundImage: `url(${footerBg})` }}
      {...props}
    >
      <div className='footer-content'>
        <div className='footer-grid'>

          <div className='footer-col footer-col-about'>
            <h2 className='handwritten-title footer-logo'>
              Gs <span className='handwritten-highlight'>emmanuel</span>
            </h2>
            <p className='footer-description'>
              Des solutions professionnelles et innovantes pour accompagner votre réussite.
            </p>
          </div>

          <div className='footer-col'>
            <ul className='footer-contact-info'>
              <li>
                <Mail size={18} />
                <span>contact@gsemmanuel.com</span>
              </li>
              <li>
                <Phone size={18} />
                <span>+33 1 23 45 67 89</span>
              </li>
            </ul>
          </div>

        </div>

        <div className='footer-bottom'>
          <p>© {new Date().getFullYear()} GSEMMANUEL. Tous droits réservés. | <a href='#' style={{ color: 'inherit', textDecoration: 'none' }}>Mentions légales</a></p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
