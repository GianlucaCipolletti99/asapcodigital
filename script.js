/* =========================================================
   A.S.A.P Digital — interacciones
   ========================================================= */
(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(hover: none)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  const nav = $('#nav');
  const progress = $('.progress');
  const glow = $('.glow');
  const menu = $('#menu');
  const burger = $('.burger');

  /* ---------- Scroll suave (Lenis) ---------- */
  let lenis = null;
  if (window.Lenis && !reduceMotion) {
    lenis = new Lenis({ duration: 1.25, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    const raf = time => { lenis.raf(time); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }

  // Links internos con desplazamiento suave
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      const target = id.length > 1 ? $(id) : null;
      if (!target) return;
      e.preventDefault();
      closeMenu();
      if (lenis) lenis.scrollTo(target, { offset: -60, duration: 1.6 });
      else target.scrollIntoView({ behavior: 'smooth' });
    });
  });

  /* ---------- Scroll: barra de progreso, nav y línea del proceso ---------- */
  const steps = $('.steps');
  const onScroll = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    nav.classList.toggle('scrolled', y > 40);

    if (steps) {
      const r = steps.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (window.innerHeight * 0.8 - r.top) / (r.height + 120)));
      steps.style.setProperty('--line', p.toFixed(3));
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Aparición de elementos ---------- */
  const reveals = $$('[data-reveal]');
  if ('IntersectionObserver' in window && !reduceMotion) {
    reveals.forEach(el => {
      const siblings = el.parentElement ? [...el.parentElement.children].filter(c => c.hasAttribute('data-reveal')) : [];
      el.style.setProperty('--delay', `${siblings.indexOf(el) * 0.12}s`);
    });
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
    reveals.forEach(el => io.observe(el));
  } else {
    reveals.forEach(el => el.classList.add('in'));
  }

  /* ---------- Link activo según sección ---------- */
  const links = $$('.menu a:not(.btn)');
  const sections = links.map(l => $(l.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === `#${en.target.id}`));
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(s => spy.observe(s));
  }

  /* ---------- Menú móvil ---------- */
  function closeMenu() {
    menu.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Abrir menú');
    if (lenis) lenis.start();
  }
  burger.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    if (lenis) open ? lenis.stop() : lenis.start();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

  /* ---------- Brillo dorado que sigue al cursor ---------- */
  if (!isTouch && !reduceMotion && glow) {
    let tx = 0, ty = 0, cx = 0, cy = 0;
    window.addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; }, { passive: true });
    const follow = () => {
      cx += (tx - cx) * 0.12;
      cy += (ty - cy) * 0.12;
      glow.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      requestAnimationFrame(follow);
    };
    follow();
  }

  /* ---------- Tarjetas: inclinación 3D + luz que sigue al mouse ---------- */
  if (!isTouch && !reduceMotion) {
    $$('.tilt').forEach(card => {
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const x = e.clientX - r.left;
        const y = e.clientY - r.top;
        const rx = ((y / r.height) - 0.5) * -8;
        const ry = ((x / r.width) - 0.5) * 8;
        card.style.setProperty('--mx', `${x}px`);
        card.style.setProperty('--my', `${y}px`);
        card.style.transition = 'border-color .4s, box-shadow .4s';
        card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-6px)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transition = 'transform .8s cubic-bezier(.22,1,.36,1), border-color .4s, box-shadow .4s';
        card.style.transform = '';
      });
    });

    /* ---------- Botones magnéticos ---------- */
    $$('.magnetic').forEach(btn => {
      btn.addEventListener('mousemove', e => {
        const r = btn.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.25;
        const y = (e.clientY - r.top - r.height / 2) * 0.35;
        btn.style.transform = `translate(${x}px, ${y}px)`;
      });
      btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
    });
  }

  /* ---------- Parallax suave de las esferas del hero ---------- */
  const orbs = $$('.orb');
  if (!reduceMotion && orbs.length) {
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      if (y > window.innerHeight * 1.2) return;
      orbs.forEach((o, i) => { o.style.transform = `translateY(${y * (i ? -0.12 : 0.2)}px)`; });
    }, { passive: true });
  }

  /* ---------- Filtros de ejemplos ---------- */
  $$('.chip').forEach(ch => ch.addEventListener('click', () => {
    $$('.chip').forEach(x => x.classList.toggle('on', x === ch));
    $$('.ex').forEach(ex => ex.classList.toggle('hide', ch.dataset.f !== 'all' && ex.dataset.t !== ch.dataset.f));
  }));

  /* ---------- Formulario: abre WhatsApp con el mensaje ---------- */
  const form = $('#form');
  if (form) form.addEventListener('submit', e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(form));
    const msg = `Hola A.S.A.P Digital! Soy ${d.nombre}. Necesito: ${d.servicio}. ${d.mensaje || ''} (WhatsApp: ${d.whatsapp}${d.email ? ', email: ' + d.email : ''})`;
    $('#ok').hidden = false;
    window.open('https://wa.me/549XXXXXXXXXX?text=' + encodeURIComponent(msg), '_blank', 'noopener');
    form.reset();
  });

  /* ---------- Año del footer ---------- */
  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();
})();
