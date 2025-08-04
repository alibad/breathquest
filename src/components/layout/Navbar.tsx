'use client';

import { useState, useEffect } from 'react';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      setScrolled(isScrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav id="navbar" className={scrolled ? 'scrolled' : ''}>
      <div className="nav-container">
        <div style={{ fontSize: '1.5rem' }}>🌀 Breath Quest</div>
        <ul className="nav-links">
          <li>
            <a 
              href="#why" 
              onClick={(e) => {
                e.preventDefault();
                scrollToSection('why');
              }}
            >
              Why
            </a>
          </li>
          <li>
            <a 
              href="#timeline" 
              onClick={(e) => {
                e.preventDefault();
                scrollToSection('timeline');
              }}
            >
              Timeline
            </a>
          </li>
          <li>
            <a 
              href="#tech" 
              onClick={(e) => {
                e.preventDefault();
                scrollToSection('tech');
              }}
            >
              Tech
            </a>
          </li>
          <li>
            <a 
              href="#demo" 
              onClick={(e) => {
                e.preventDefault();
                scrollToSection('demo');
              }}
            >
              Demo
            </a>
          </li>
          <li>
            <a 
              href="#story" 
              onClick={(e) => {
                e.preventDefault();
                scrollToSection('story');
              }}
            >
              Story
            </a>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;