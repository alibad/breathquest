'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

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
                href="#hypotheses"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection('hypotheses');
                }}
              >
                Hypotheses
              </a>
            ) : (
              <Link href="/#hypotheses">Hypotheses</Link>
            )}
          </li>
          <li>
            <Link href="/hypothesis-1">
              Demo
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