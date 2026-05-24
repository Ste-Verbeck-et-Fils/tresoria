import React, { useState, useEffect } from 'react'
import { Menu, X, ChevronDown } from 'lucide-react'
import Button from '../ui/Button'
import './Header.css'

const Header = ({
  links,
  actionButtonLabel = 'Se connecter',
  onActionClick,
  className = '',
  ...props
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMobileMenuOpen])

  const navLinks = links && links.length > 0
    ? links
    : [
        { label: 'Accueil', href: '#', active: true },
        { label: 'Services', href: '#', hasDropdown: true },
        { label: 'À propos', href: '#' },
        { label: 'Contact', href: '#' },
        { label: 'Aide', href: '#' },
      ]

  return (
    <header className={`gsemmanuel-header ${className}`} {...props}>
      <div className='header-container'>
        <div className='header-logo'>
          <div className='logo-icon-wrapper' />
          <h2 className='handwritten-title'>
            Gs <span className='handwritten-highlight'>emmanuel</span>
          </h2>
        </div>

        <nav className='header-nav-desktop'>
          <div className='header-nav-bg' />
          <ul className='header-nav-list'>
            {navLinks.map((link, idx) => (
              <li key={idx} className='header-nav-item'>
                <a
                  href={link.href}
                  className={`header-link ${link.active ? 'header-link--active' : ''}`}
                >
                  {link.label}
                  {link.hasDropdown && <ChevronDown size={14} className='dropdown-icon' />}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className='header-actions'>
          <Button variant='super' label={actionButtonLabel} onClick={onActionClick} />
        </div>

        <button
          className='header-mobile-toggle'
          onClick={() => setIsMobileMenuOpen(true)}
          aria-label='Ouvrir le menu'
          aria-expanded={isMobileMenuOpen}
        >
          <Menu />
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className='mobile-overlay' onClick={() => setIsMobileMenuOpen(false)} aria-hidden='true' />
      )}

      <div className={`header-nav-mobile-sidebar ${isMobileMenuOpen ? 'open' : ''}`} role='dialog' aria-modal='true' aria-label='Menu de navigation'>
        <div className='mobile-sidebar-header'>
          <div className='header-logo header-logo--dark'>
            <div className='logo-icon-wrapper' style={{ color: 'var(--color-header-text)' }} />
            <h2 className='handwritten-title'>
              Gs <span className='handwritten-highlight'>emmanuel</span>
            </h2>
          </div>
          <button className='mobile-close-btn' onClick={() => setIsMobileMenuOpen(false)} aria-label='Fermer le menu'>
            <X size={24} />
          </button>
        </div>

        <nav className='mobile-nav-list'>
          {navLinks.map((link, idx) => (
            <a
              key={idx}
              href={link.href}
              className={`mobile-link ${link.active ? 'mobile-link--active' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {link.label}
              {link.hasDropdown && <ChevronDown size={16} />}
            </a>
          ))}

          <div className='mobile-nav-action'>
            <Button variant='super' label={actionButtonLabel} onClick={onActionClick} style={{ width: '100%' }} />
          </div>
        </nav>
      </div>
    </header>
  )
}

export default Header
