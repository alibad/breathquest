'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const demoRef = useRef<HTMLLIElement | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      setScrolled(isScrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close demo menu on outside click or route change
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!demoRef.current) return;
      if (!demoRef.current.contains(e.target as Node)) setIsDemoOpen(false);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const isHomePage = pathname === '/';

  return (
    <nav id="navbar" className={scrolled ? 'scrolled' : ''}>
      <div className="nav-container">
        <Link 
          href="/"
          style={{ 
            fontSize: '1.5rem', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            textDecoration: 'none',
            color: 'inherit'
          }}
        >
          <Image 
            src="/logo.svg" 
            alt="Breath Quest Logo" 
            width={32}
            height={32}
          />
          Breath Quest
        </Link>
        <ul className="nav-links">
          <li>
            {isHomePage ? (
              <a
                href="#why"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection('why');
                }}
              >
                Why
              </a>
            ) : (
              <Link href="/#why">Why</Link>
            )}
          </li>
          <li>
            {isHomePage ? (
              <a
                href="#timeline"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection('timeline');
                }}
              >
                Timeline
              </a>
            ) : (
              <Link href="/#timeline">Timeline</Link>
            )}
          </li>
          <li>
            {isHomePage ? (
              <a
                href="#tech"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection('tech');
                }}
              >
                Tech
              </a>
            ) : (
              <Link href="/#tech">Tech</Link>
            )}
          </li>
          <li>
            {isHomePage ? (
              <a
                href="#hypothesis"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection('hypothesis');
                }}
              >
                Hypotheses
              </a>
            ) : (
              <Link href="/#hypothesis">Hypotheses</Link>
            )}
          </li>
          <li ref={demoRef} style={{ position: 'relative' }}
              onMouseEnter={() => setIsDemoOpen(true)}>
            <button
              onClick={() => setIsDemoOpen((v) => !v)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
                font: 'inherit'
              }}
              aria-haspopup="menu"
              aria-expanded={isDemoOpen}
            >
              Demo ▾
            </button>
            {isDemoOpen && (
              <div
                role="menu"
                style={{
                  position: 'absolute',
                  top: '2.2rem',
                  right: 0,
                  width: '360px',
                  background: 'rgba(0, 0, 0, 0.9)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '12px',
                  padding: '0.5rem',
                  boxShadow: '0 10px 24px rgba(0,0,0,0.4)',
                  zIndex: 1000
                }}
                onMouseEnter={() => setIsDemoOpen(true)}
              >
                <Link href="/hypothesis-1" onClick={() => setIsDemoOpen(false)}
                  style={{
                    display: 'block',
                    textDecoration: 'none',
                    color: 'inherit',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.05)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong>Hypothesis #1: Breath Detection</strong>
                    <span style={{ background: '#00ff88', color: '#000', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 800 }}>Completed</span>
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#ccc', marginTop: '0.25rem' }}>
                    Calibration + play modes. Technically works; too noise‑sensitive for real‑world use.
                  </div>
                </Link>
                <div style={{ height: '0.5rem' }} />
                <Link href="/hypothesis-2" onClick={() => setIsDemoOpen(false)}
                  style={{
                    display: 'block',
                    textDecoration: 'none',
                    color: 'inherit',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.05)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong>Hypothesis #2: Clap Patterns</strong>
                    <span style={{ background: '#00ff88', color: '#000', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 800 }}>Done</span>
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#ccc', marginTop: '0.25rem' }}>
                    Onset + pattern detection (single/double/triple). Robust, responsive control; mini‑game included.
                  </div>
                </Link>
                <div style={{ height: '0.5rem' }} />
                <Link href="/hypothesis-3" onClick={() => setIsDemoOpen(false)}
                  style={{
                    display: 'block',
                    textDecoration: 'none',
                    color: 'inherit',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.05)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong>Hypothesis #3: Fun Sound Game</strong>
                    <span style={{ background: '#ffaa44', color: '#000', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 800 }}>New</span>
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#ccc', marginTop: '0.25rem' }}>
                    Build a fun mini‑game powered by claps (voice later). Jump/Fire/Special.
                  </div>
                </Link>
              </div>
            )}
          </li>
          <li>
            <Link href="/audio-tools">
              Audio Tools
            </Link>
          </li>
          <li>
            <a 
              href="https://github.com/alibad/breathquest" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                textDecoration: 'none',
                color: 'inherit'
              }}
            >
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="currentColor"
              >
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              GitHub
            </a>
          </li>
          <li>
            {isHomePage ? (
              <a
                href="#story"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection('story');
                }}
              >
                Story
              </a>
            ) : (
              <Link href="/#story">Story</Link>
            )}
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;