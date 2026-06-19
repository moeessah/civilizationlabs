(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const on = (el, ev, fn, opts) => el && el.addEventListener(ev, fn, opts);

  function initNav() {
    const nav = $('#mainNav');
    const menu = $('.nav-menu');
    const trigger = $('.nav-menu-trigger');
    const topLinks = $$('.nav-links a[href^="#"]');
    const menuLinks = $$('.nav-menu-panel a[href^="#"]');
    const sections = $$('section[data-nav-label]');
    const currentLabel = $('.nav-current strong');
    const currentWrap = $('.nav-current');
    let activeLabel = currentLabel?.textContent || '';

    const syncSolid = () => nav?.classList.toggle('solid', window.scrollY > 40);

    const closeMenu = () => {
      menu?.classList.remove('open');
      trigger?.setAttribute('aria-expanded', 'false');
    };

    const updateActive = () => {
      if (!sections.length) return;
      const marker = window.innerHeight * 0.34;
      let best = sections[0];
      let bestDist = Infinity;

      sections.forEach(s => {
        const r = s.getBoundingClientRect();
        if (r.bottom < 0 || r.top > window.innerHeight) return;
        const d = Math.abs(r.top - marker);
        if (d < bestDist) { bestDist = d; best = s; }
      });

      const id = best.id;
      const label = best.dataset.navLabel || '';

      [...topLinks, ...menuLinks].forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
      });

      if (currentLabel && label && label !== activeLabel) {
        activeLabel = label;
        currentLabel.textContent = label;
        currentWrap?.classList.remove('pulse');
        void currentWrap?.offsetWidth;
        currentWrap?.classList.add('pulse');
      }
    };

    on(window, 'scroll', syncSolid, { passive: true });
    on(window, 'scroll', updateActive, { passive: true });
    on(window, 'resize', updateActive);

    on(trigger, 'click', () => {
      const open = menu?.classList.toggle('open');
      trigger.setAttribute('aria-expanded', String(open));
    });

    menuLinks.forEach(link => on(link, 'click', closeMenu));
    on(document, 'click', e => { if (menu && !menu.contains(e.target)) closeMenu(); });
    on(document, 'keydown', e => { if (e.key === 'Escape') closeMenu(); });

    syncSolid();
    updateActive();
  }

  function initTrustPlant() {
    const section = $('.trust');
    const plant = $('.trust-plant');
    const cells = $$('.trust-cell');
    if (!section || !plant) return;

    const hits = (rect, x, y) => x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;

    on(window, 'mousemove', e => {
      const overPlant = hits(plant.getBoundingClientRect(), e.clientX, e.clientY);
      const overCell = cells.some(c => hits(c.getBoundingClientRect(), e.clientX, e.clientY));
      section.classList.toggle('plant-front', overPlant && !overCell);
    });

    on(window, 'scroll', () => section.classList.remove('plant-front'), { passive: true });
  }

  function initReveals() {
    const items = $$('.reveal,.reveal-l,.reveal-r');
    if (!items.length) return;

    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.08 });

    items.forEach(item => obs.observe(item));
  }

  function initCarousel() {
    const track = $('#carouselTrack');
    const cards = track ? $$('.tcard', track) : [];
    if (!track || !cards.length) return;

    let current = Math.min(1, cards.length - 1);
    let autoTimer;

    const wrapOffset = (i, active, total) => {
      let off = i - active;
      if (off > total / 2) off -= total;
      if (off < -total / 2) off += total;
      return off;
    };

    const apply = () => {
      const total = cards.length;
      cards.forEach((card, i) => {
        const off = wrapOffset(i, current, total);
        const dist = Math.abs(off);

        if (dist > 2) { card.style.display = 'none'; return; }
        card.style.display = '';

        const scale = dist === 0 ? 1 : dist === 1 ? 0.78 : 0.62;
        const tx = off * 360;
        const tz = dist === 0 ? 0 : dist === 1 ? -120 : -220;
        const ry = off * -10;

        card.style.transform = `translate(-50%,-50%) translateX(${tx}px) translateZ(${tz}px) rotateY(${ry}deg) scale(${scale})`;
        card.style.opacity = dist === 0 ? '1' : dist === 1 ? '.56' : '.24';
        card.style.zIndex = String(20 - dist);
        card.style.filter = dist > 1 ? 'blur(1px)' : '';
        card.style.pointerEvents = dist === 0 ? 'auto' : 'none';
        card.style.boxShadow = dist === 0
          ? '0 34px 90px rgba(14,14,12,.18)'
          : '0 10px 28px rgba(14,14,12,.07)';
      });
    };

    const advance = dir => {
      current = (current + dir + cards.length) % cards.length;
      apply();
    };

    const stopAuto = () => clearInterval(autoTimer);
    const startAuto = () => {
      stopAuto();
      autoTimer = setInterval(() => advance(1), 2200);
    };

    on($('#nextBtn'), 'click', () => advance(1));
    on($('#prevBtn'), 'click', () => advance(-1));
    on(track, 'mouseenter', stopAuto);
    on(track, 'mouseleave', startAuto);

    let touchStartX = 0;
    on(track, 'touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
    on(track, 'touchend', e => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > 40) advance(dx < 0 ? 1 : -1);
    }, { passive: true });

    apply();
    startAuto();
  }

  function initCaseSwitcher() {
    const cases = {
      pricing: {
        type: 'Pricing change',
        title: 'Raise pricing by 18% next quarter.',
        copy: 'New customers may accept the higher price. Existing renewals need a completely separate cohort test before you roll this across the base.',
        weak: 'The plan treats new customers and existing renewals as a single pricing decision.',
        test: 'Run a renewal cohort before applying the change across the existing base.',
        evidence: 'Renewal objections, discount request patterns, and account-level value proof.'
      },
      launch: {
        type: 'Product launch',
        title: 'Ship the AI workflow feature in Q3.',
        copy: 'The launch memo says customers asked for automation. The evidence supports discovery interest, not a full launch commitment.',
        weak: 'Five sales calls and one enterprise prospect are carrying the entire launch case.',
        test: 'Run a beta cohort with 12 active users and measure repeat use after two weeks.',
        evidence: 'Repeat use rate, activation lift, support burden, and budget owner urgency.'
      },
      campaign: {
        type: 'Campaign spend',
        title: 'Spend $50K on a founder-led campaign.',
        copy: "The campaign depends on founder authority, but the plan hasn't tested whether the target buyer trusts the founder on this specific topic.",
        weak: 'Audience interest is being treated as buying intent.',
        test: 'Run a smaller content test across three audience segments before committing full budget.',
        evidence: 'Conversion by segment, sales follow-up quality, and reply intent.'
      },
      roadmap: {
        type: 'Roadmap bet',
        title: 'Move next quarter toward enterprise workflows.',
        copy: "Enterprise demand is inferred from sales conversations, but the plan doesn't show willingness to pay or implementation readiness.",
        weak: 'Sales requests are being treated as product strategy with budget behind it.',
        test: 'Build a proof table separating interest, budget signal, urgency, and implementation readiness.',
        evidence: 'Budget signal, implementation readiness, and estimated support cost.'
      }
    };

    const panel = $('.case-panel');
    if (!panel) return;

    const fields = {
      type: $('#caseType'),
      title: $('#caseTitle'),
      copy: $('#caseCopy'),
      weak: $('#caseWeak'),
      test: $('#caseTest'),
      evidence: $('#caseEvidence')
    };

    $$('.ctab').forEach(btn => {
      on(btn, 'click', () => {
        const next = cases[btn.dataset.case];
        if (!next) return;

        $$('.ctab').forEach(t => {
          const active = t === btn;
          t.classList.toggle('active', active);
          t.setAttribute('aria-selected', String(active));
        });

        panel.style.transition = 'opacity .25s,transform .25s';
        panel.style.opacity = '0';
        panel.style.transform = 'translateY(10px)';

        setTimeout(() => {
          Object.entries(fields).forEach(([k, node]) => { if (node) node.textContent = next[k]; });
          panel.style.opacity = '1';
          panel.style.transform = '';
        }, 220);
      });
    });
  }

  function initIntakeForm() {
    const form = $('#intakeForm');
    const ndaSelect = $('#ndaSelect');
    const uploadHelp = $('#uploadHelp');
    const warning = $('#scopeWarning');
    const success = $('#successState');

    const restricted = [
      'hire','fire','employee','salary','compensation','lawsuit','legal',
      'attorney','tax','investment','securities','insurance','medical',
      'diagnosis','visa','immigration'
    ];

    const getScopeText = () =>
      ['decisionType','decisionText','stakesText','summaryText']
        .map(id => $(`#${id}`)?.value || '')
        .join(' ')
        .toLowerCase();

    const checkScope = () => {
      const type = $('#decisionType')?.value;
      const text = getScopeText();
      const flagged = type === 'Other' || restricted.some(t => text.includes(t));
      warning?.classList.toggle('show', flagged);
    };

    ['decisionType','decisionText','stakesText','summaryText'].forEach(id => {
      const field = $(`#${id}`);
      on(field, 'input', checkScope);
      on(field, 'change', checkScope);
    });

    on(ndaSelect, 'change', e => {
      if (!uploadHelp) return;
      uploadHelp.textContent = e.target.value === 'Yes'
        ? 'Submit the summary now. We will send NDA details before asking for full materials.'
        : 'Decks, memos, spreadsheets, roadmap notes, customer research, campaign briefs.';
    });

    on(form, 'submit', e => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      form.style.display = 'none';
      success?.classList.add('show');
      success?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  function initPatternHover() {
    const items = $$('.pattern-item');
    if (!items.length) return;

    items.forEach(active => {
      on(active, 'mouseenter', () => {
        items.forEach(item => { if (item !== active) item.style.borderColor = 'transparent'; });
      });
      on(active, 'mouseleave', () => {
        items.forEach(item => { item.style.borderColor = ''; });
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initNav();
    initTrustPlant();
    initReveals();
    initCarousel();
    initCaseSwitcher();
    initIntakeForm();
    initPatternHover();
  });
})();
