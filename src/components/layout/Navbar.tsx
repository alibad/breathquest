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