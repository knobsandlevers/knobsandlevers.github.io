/* ═══════════════════════════════════════════════════════
   KNOBS AND LEVERS — transitions.js
   Page transitions, scroll reveals, tab logic, audio, modals
═══════════════════════════════════════════════════════ */

/* ── PAGE VEIL TRANSITION ── */
(function () {
  const veil = document.getElementById('page-veil');
  if (!veil) return;

  // Fade in on load
  window.addEventListener('DOMContentLoaded', () => {
    veil.classList.remove('visible');
  });

  // Intercept internal link clicks
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href]');
    if (!link) return;
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto:') ||
        href.startsWith('http') || href.startsWith('tel:') ||
        link.target === '_blank') return;

    e.preventDefault();
    veil.classList.add('visible');
    setTimeout(() => { window.location.href = href; }, 360);
  });

  // Start hidden, animate out
  veil.classList.remove('visible');
})();

/* ── SET ACTIVE NAV LINK ── */
(function () {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(link => {
    const linkPath = link.getAttribute('href').split('/').pop();
    if (linkPath === path) link.classList.add('active');
  });
})();

/* ── SCROLL REVEAL ── */
(function () {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  els.forEach(el => io.observe(el));
})();

/* ── STAGGERED REVEAL CHILDREN ── */
(function () {
  document.querySelectorAll('.stagger-children > *').forEach((child, i) => {
    child.style.transitionDelay = `${i * 80}ms`;
    child.classList.add('reveal');
  });
})();

/* ── TABS ── */
(function () {
  document.querySelectorAll('.tabs').forEach(tabGroup => {
    const buttons = tabGroup.querySelectorAll('.tab-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.tab;
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.tab-panel').forEach(panel => {
          panel.classList.toggle('active', panel.id === target);
        });
      });
    });
  });
})();

/* ── CUSTOM AUDIO PLAYER ── */
(function () {
  const PLAY_ICON = `<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>`;
  const PAUSE_ICON = `<svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`;

  let currentAudio = null;
  let currentBtn = null;
  let currentBars = null;
  let animFrame = null;

  function generateBars(container) {
    container.innerHTML = '';
    const count = 40;
    const heights = Array.from({ length: count }, () =>
      Math.floor(Math.random() * 70 + 15)
    );
    heights.forEach(h => {
      const span = document.createElement('span');
      span.style.height = h + '%';
      container.appendChild(span);
    });
    return Array.from(container.querySelectorAll('span'));
  }

  function animateBars(bars, audio) {
    if (!audio || audio.paused) return;
    bars.forEach((bar, i) => {
      const t = Date.now() / 1000;
      const wave = Math.sin(t * 4 + i * 0.4) * 0.4 + 0.6;
      const base = parseInt(bar.dataset.base) || 30;
      bar.style.height = Math.min(95, base * wave) + '%';
      bar.style.background = `linear-gradient(to top, var(--violet), var(--blue-hi))`;
    });
    animFrame = requestAnimationFrame(() => animateBars(bars, audio));
  }

  function stopAnimation(bars) {
    cancelAnimationFrame(animFrame);
    if (bars) {
      bars.forEach(bar => {
        bar.style.height = bar.dataset.base + '%';
        bar.style.background = 'var(--border-hi)';
      });
    }
  }

  document.querySelectorAll('.audio-card').forEach(card => {
    const audio = card.querySelector('audio');
    const playBtn = card.querySelector('.play-btn');
    const waveContainer = card.querySelector('.waveform-visual');
    const durationEl = card.querySelector('.audio-duration');
    if (!audio || !playBtn) return;

    const bars = generateBars(waveContainer);
    bars.forEach(bar => { bar.dataset.base = parseInt(bar.style.height); });
    playBtn.innerHTML = PLAY_ICON;

    audio.addEventListener('loadedmetadata', () => {
      const m = Math.floor(audio.duration / 60);
      const s = Math.floor(audio.duration % 60).toString().padStart(2, '0');
      if (durationEl) durationEl.textContent = `${m}:${s}`;
    });

    audio.addEventListener('ended', () => {
      playBtn.innerHTML = PLAY_ICON;
      playBtn.classList.remove('playing');
      stopAnimation(bars);
      currentAudio = null;
      currentBtn = null;
      currentBars = null;
    });

    playBtn.addEventListener('click', () => {
      if (currentAudio && currentAudio !== audio) {
        currentAudio.pause();
        currentBtn.innerHTML = PLAY_ICON;
        currentBtn.classList.remove('playing');
        stopAnimation(currentBars);
      }

      if (audio.paused) {
        audio.play();
        playBtn.innerHTML = PAUSE_ICON;
        playBtn.classList.add('playing');
        currentAudio = audio;
        currentBtn = playBtn;
        currentBars = bars;
        animateBars(bars, audio);
      } else {
        audio.pause();
        playBtn.innerHTML = PLAY_ICON;
        playBtn.classList.remove('playing');
        stopAnimation(bars);
        currentAudio = null;
        currentBtn = null;
        currentBars = null;
      }
    });

    // Click on waveform to seek
    waveContainer.addEventListener('click', (e) => {
      if (!audio.duration) return;
      const rect = waveContainer.getBoundingClientRect();
      const pct = (e.clientX - rect.left) / rect.width;
      audio.currentTime = pct * audio.duration;
    });
  });
})();

/* ── VIDEO MODAL ── */
(function () {
  const overlay = document.getElementById('video-modal');
  if (!overlay) return;

  const closeBtn = overlay.querySelector('.modal-close');
  const videoEl = overlay.querySelector('.modal-video');
  const titleEl = overlay.querySelector('.modal-title');
  const descEl = overlay.querySelector('.modal-desc');

  function openModal(src, title, desc) {
    videoEl.src = src;
    if (titleEl) titleEl.textContent = title || '';
    if (descEl) descEl.textContent = desc || '';
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    overlay.classList.remove('open');
    videoEl.pause();
    videoEl.src = '';
    document.body.style.overflow = '';
  }

  closeBtn && closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

  document.querySelectorAll('[data-video]').forEach(card => {
    card.addEventListener('click', () => {
      openModal(
        card.dataset.video,
        card.dataset.title || '',
        card.dataset.desc || ''
      );
    });
  });
})();

/* ── CONTACT FORM ── */
(function () {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const successEl = document.getElementById('form-success');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('[type="submit"]');
    const orig = btn.textContent;
    btn.textContent = 'Sending...';
    btn.disabled = true;

    try {
      const res = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
      });

      if (res.ok) {
        form.style.display = 'none';
        if (successEl) successEl.style.display = 'block';
      } else {
        btn.textContent = 'Error — try again';
        btn.disabled = false;
      }
    } catch {
      // Fallback: open mailto
      const name = form.querySelector('[name="name"]')?.value || '';
      const email = form.querySelector('[name="email"]')?.value || '';
      const type = form.querySelector('[name="type"]')?.value || '';
      const msg = form.querySelector('[name="message"]')?.value || '';
      window.location.href = `mailto:cateyesblake@gmail.com?subject=${encodeURIComponent(type + ' Inquiry from ' + name)}&body=${encodeURIComponent(msg + '\n\nReply to: ' + email)}`;
      btn.textContent = orig;
      btn.disabled = false;
    }
  });
})();
