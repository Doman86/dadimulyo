import { Link } from 'react-router-dom';

const navLinks = [
  { to: '/trucks', label: 'Katalog Truck' },
  { to: '/rental', label: 'Sewa Truck' },
  { to: '/oranges', label: 'Marketplace Jeruk' },
  { to: '/compare', label: 'Bandingkan Truck' },
];

const companyLinks = [
  { to: '/about', label: 'Tentang Kami' },
  { to: '/contact', label: 'Kontak' },
  { to: '/faq', label: 'FAQ' },
  { to: '/login', label: 'Masuk' },
];

const contactItems = [
  {
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.7"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
    ),
    text: 'Wagir, Kabupaten Malang, Jawa Timur',
  },
  {
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.7"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>
    ),
    text: '0812-3456-7890',
  },
  {
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.7"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
    ),
    text: 'info@dadimulyo.com',
  },
];

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-primary-dark">
      <div className="orb orb-1 -bottom-40 -right-40 opacity-20" />
      <div className="orb orb-2 top-[-100px] left-[-80px] opacity-20" />
      <div className="hero-grid-bg absolute inset-0 opacity-60" />
      <div className="divider-gold absolute top-0 left-0 right-0" />

      <div className="relative z-10 mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="group inline-flex items-center gap-3">
              <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-gold-light via-gold to-gold-deep font-display text-lg font-bold text-forest shadow-lg shadow-gold/30 transition-transform duration-500 group-hover:rotate-[8deg] group-hover:scale-105">
                DM
                <span className="absolute inset-0 rounded-xl ring-1 ring-white/40" />
              </span>
              <span className="font-display text-xl tracking-tight text-white">
                Dadi<span className="text-gold-gradient"> Mulyo</span>
              </span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-white/45">
              Showroom truck dan marketplace jeruk segar dari Wagir, Kabupaten
              Malang. Harga transparan, foto asli, pengiriman terpercaya.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-gold-light">Navigasi</h3>
            <ul className="mt-4 space-y-2.5">
              {navLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="link-underline text-sm text-white/60 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-gold-light">Perusahaan</h3>
            <ul className="mt-4 space-y-2.5">
              {companyLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="link-underline text-sm text-white/60 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-gold-light">Hubungi Kami</h3>
            <ul className="mt-4 space-y-3.5">
              {contactItems.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-white/60">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gold/10 text-gold-light">
                    {item.icon}
                  </span>
                  <span className="leading-snug">{item.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="divider-gold mt-12" />

        <div className="mt-6 flex flex-col items-center justify-between gap-3 text-xs text-white/35 sm:flex-row">
          <p>© {new Date().getFullYear()} Dadi Mulyo. Seluruh hak cipta dilindungi.</p>
          <p className="flex items-center gap-1.5">
            Wagir, Kabupaten Malang — Jawa Timur
            <span className="h-1 w-1 rounded-full bg-gold/60" />
            Melayani seluruh Jawa Timur
          </p>
        </div>
      </div>
    </footer>
  );
}
