import { useState } from 'react';

interface HeaderProps {
  currentPath?: string;
}

export default function Header({ currentPath = '/' }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { label: 'About', href: '/about' },
    { label: 'Services', href: '/services' },
    { label: 'Blog', href: '/blog' },
  ];

  const isActive = (path: string) => currentPath === path;

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
      <nav className="max-w-6xl mx-auto flex items-center justify-between py-4 px-4 sm:px-6 lg:px-8">
        {/* Left: Brand + Primary Links */}
        <div className="flex items-center gap-8">
          <a
            href="/"
            className="inline-block text-2xl font-bold tracking-tight text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-black/10 rounded-sm px-1"
            aria-label="SuperLife - Home"
          >
            SuperLife®
          </a>

          <span className="hidden md:inline-block w-1 h-1 rounded-full bg-[#D4AF37]"></span>

          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`inline-block text-lg font-medium text-ink rounded-md px-2 py-1 transition-transform duration-200 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/10 ${
                  isActive(item.href) ? 'opacity-100' : ''
                }`}
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>

        {/* Right: CTA (desktop) + Burger (mobile) */}
        <div className="flex items-center gap-3">
          <a
            href="#book-consultation"
            className="hidden md:inline-flex items-center gap-2 rounded-full bg-black text-white px-5 py-2.5 text-sm font-semibold shadow-sm ring-1 ring-[#D4AF37]/40 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/40 hover:ring-2 hover:ring-[#D4AF37]/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/60 active:translate-y-px"
            aria-label="Book a consultation session"
          >
            Book Consultation
          </a>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-ink hover:text-[#D4AF37] transition-colors duration-300"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={isMenuOpen}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isMenuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100">
          <div className="container py-4 space-y-4">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`block text-lg font-medium text-ink rounded-md px-2 py-1 transition-colors duration-200 hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/10 ${
                  isActive(item.href) ? 'opacity-100' : ''
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </a>
            ))}
            
            <a
              href="#book-consultation"
              className="inline-flex w-fit items-center gap-2 rounded-full bg-black text-white px-5 py-2.5 text-sm font-semibold shadow-sm ring-1 ring-[#D4AF37]/40 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/40 hover:ring-2 hover:ring-[#D4AF37]/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/60 active:translate-y-px"
              onClick={() => setIsMenuOpen(false)}
              aria-label="Book a consultation session"
            >
              Book Consultation
            </a>
          </div>
        </div>
      )}
    </header>
  );
}