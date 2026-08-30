/* ============================================================
   DADI MULYO — LANDING PAGE JS
   ============================================================ */

(function () {
  'use strict';

  /* ---------- Apply site config ---------- */
  if (typeof SITE !== 'undefined') {
    document.querySelectorAll('.wa-link').forEach((el) => {
      el.href = SITE.contact.whatsappUrl;
    });
    document.querySelectorAll('.phone-link').forEach((el) => {
      el.href = 'tel:' + SITE.contact.phoneDigits;
    });
    document.querySelectorAll('.phone-display').forEach((el) => {
      el.textContent = el.textContent ? SITE.contact.phone + el.textContent.replace(/^\s*[··]\s*/, ' · ') : SITE.contact.phone;
    });
    document.querySelectorAll('.company-name').forEach((el) => {
      el.textContent = SITE.company.name;
    });
    document.querySelectorAll('.address-full').forEach((el) => {
      el.textContent = SITE.address.full;
    });
    document.querySelectorAll('.brand-name').forEach((el) => {
      el.innerHTML = SITE.company.name.split(' ')[0] + '<span>' + (SITE.company.name.split(' ')[1] || '') + '</span>';
    });
  }

  /* ---------- Navbar: shrink on scroll ---------- */
  const nav = document.getElementById('navbar');
  const onScrollNav = () => nav.classList.toggle('scrolled', window.scrollY > 40);
  window.addEventListener('scroll', onScrollNav, { passive: true });
  onScrollNav();

  /* ---------- Mobile menu ---------- */
  const toggle = document.getElementById('navToggle');
  const links = document.getElementById('navLinks');
  toggle.addEventListener('click', () => links.classList.toggle('open'));
  links.querySelectorAll('a').forEach((a) =>
    a.addEventListener('click', () => links.classList.remove('open'))
  );

  /* ---------- Reveal on scroll ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );
  revealEls.forEach((el) => io.observe(el));

  /* ---------- Count-up stats ---------- */
  const counters = document.querySelectorAll('[data-count]');
  const countIO = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseFloat(el.dataset.count);
        const suffix = el.dataset.suffix || '';
        const duration = 1800;
        const start = performance.now();
        const tick = (now) => {
          const p = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - p, 4);
          el.textContent = Math.floor(eased * target).toLocaleString('id-ID') + suffix;
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        obs.unobserve(el);
      });
    },
    { threshold: 0.6 }
  );
  counters.forEach((el) => countIO.observe(el));

  /* ---------- Gold particles in hero ---------- */
  const particlesHost = document.getElementById('particles');
  if (particlesHost) {
    const count = window.innerWidth < 720 ? 22 : 40;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      p.className = 'particle';
      const size = 3 + Math.random() * 5;
      p.style.width = size + 'px';
      p.style.height = size + 'px';
      p.style.left = Math.random() * 100 + '%';
      const duration = 7 + Math.random() * 9;
      p.style.animationDuration = duration + 's';
      p.style.animationDelay = Math.random() * duration * -1 + 's';
      p.style.opacity = 0;
      particlesHost.appendChild(p);
    }
  }

  /* ---------- Contact form (demo) ---------- */
  const form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type=submit]');
      btn.disabled = true;
      const original = btn.textContent;
      btn.textContent = 'Mengirim...';
      setTimeout(() => {
        btn.innerHTML = '✓ Pesan terkirim — kami akan segera menghubungi Anda';
        btn.classList.add('sent');
        setTimeout(() => {
          btn.textContent = original;
          btn.classList.remove('sent');
          btn.disabled = false;
          form.reset();
        }, 4000);
      }, 900);
    });
  }

  /* ---------- Fototahun footer ---------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();