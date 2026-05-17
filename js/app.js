// ===== UNION OF GENIUS — APP.JS (Supabase edition) =====
// Requires js/db.js to be loaded first (see index.html <script> order)

// ──────────────────────────────────────
// PAGE ROUTING
// ──────────────────────────────────────
function navigate(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + pageId);
  if (target) {
    target.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  document.querySelectorAll('.nav-links a, .mobile-nav a').forEach(a => {
    a.classList.toggle('active', a.dataset.page === pageId);
  });
  closeMobileNav();
  history.pushState({}, '', '#' + pageId);
  if (pageId === 'blog') loadBlogPage();
}

// ──────────────────────────────────────
// NAVIGATION
// ──────────────────────────────────────
function initNav() {
  const nav       = document.querySelector('nav');
  const hamburger = document.querySelector('.hamburger');

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 20);
  });

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    document.querySelector('.mobile-nav').classList.toggle('open');
  });

  document.querySelectorAll('[data-page]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      navigate(el.dataset.page);
    });
  });
}

function closeMobileNav() {
  document.querySelector('.hamburger').classList.remove('open');
  document.querySelector('.mobile-nav').classList.remove('open');
}

// ──────────────────────────────────────
// REGISTRATION FORM
// ──────────────────────────────────────
function initRegistrationForm() {
  const form = document.getElementById('reg-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('.btn-submit');
    btn.textContent = 'Registering...';
    btn.disabled = true;

    const data = {
      first_name:   form.firstName.value.trim(),
      last_name:    form.lastName.value.trim(),
      email:        form.email.value.trim(),
      phone:        form.phone.value.trim(),
      organization: form.organization.value.trim(),
      state:        form.state.value,
      event:        form.event.value,
      experience:   form.experience.value,
      motivation:   form.motivation.value.trim(),
      newsletter:   form.newsletter.checked,
    };

    try {
      const row = await sbInsert('registrations', data);
      form.style.display = 'none';
      const success = document.getElementById('reg-success');
      success.style.display = 'block';
      const regId = row && row.id ? String(row.id).padStart(5, '0') : '00001';
      success.querySelector('.reg-id').textContent = 'REG-UOG-' + regId;
      showToast('Registration confirmed! Your spot is saved.');
    } catch (err) {
      console.error('Registration error:', err);
      btn.textContent = 'Submit Registration';
      btn.disabled = false;
      const msg = err.message || '';
      if (msg.includes('RLS') || msg.includes('403') || msg.includes('policy')) {
        alert('Server error: Database policy blocked the request. Contact the site admin.');
      } else if (msg.includes('404') || msg.includes('not found')) {
        alert('Server error: Database table not found. Contact the site admin.');
      } else if (msg.includes('keys') || msg.includes('401')) {
        alert('Server error: Database not configured. Contact the site admin.');
      } else {
        alert('Registration failed. Please check your connection and try again.');
      }
    }
  });
}

// ──────────────────────────────────────
// CONTACT FORM
// ──────────────────────────────────────
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('.btn-submit-contact');
    btn.textContent = 'Sending...';
    btn.disabled = true;

    const data = {
      name:    document.getElementById('contactName').value.trim(),
      email:   document.getElementById('contactEmail').value.trim(),
      subject: document.getElementById('contactSubject').value.trim(),
      message: document.getElementById('contactMessage').value.trim(),
    };

    try {
      await sbInsert('contacts', data);
      form.reset();
      btn.textContent = 'Message Sent! ✓';
      btn.style.background = 'var(--accent-green)';
      btn.style.color = 'var(--bg-deep)';
      showToast("Your message has been sent. We'll respond soon!");
      setTimeout(() => {
        btn.textContent = 'Send Message';
        btn.style.background = '';
        btn.style.color = '';
        btn.disabled = false;
      }, 4000);
    } catch (err) {
      console.error('Contact error:', err);
      btn.textContent = 'Send Message';
      btn.disabled = false;
      alert('Failed to send message. Please try again.');
    }
  });
}

// ──────────────────────────────────────
// TOAST NOTIFICATION
// ──────────────────────────────────────
function showToast(message) {
  const notif = document.getElementById('db-notification');
  if (!notif) return;
  notif.querySelector('p').textContent = message;
  notif.classList.add('show');
  setTimeout(() => notif.classList.remove('show'), 4500);
}

// ──────────────────────────────────────
// BLOG — static seed posts (always shown as fallback)
// ──────────────────────────────────────
const STATIC_BLOGS = [
  {
    id: 'static-1',
    emoji: '🤖',
    category: 'Artificial Intelligence',
    title: 'What ChatGPT Means for Nigerian Students and Educators',
    excerpt: "As AI tools proliferate globally, Nigerian classrooms face both a challenge and an enormous opportunity. Here's how we're responding.",
    content: "Artificial intelligence is no longer a distant concept confined to Silicon Valley labs — it has landed squarely in Nigeria's homes, schools, and workplaces. ChatGPT alone amassed over 100 million users within months of its launch, and Nigerian students were among the early adopters.\n\nFor educators, this raises urgent questions: Is AI a threat to academic integrity? Or is it the most powerful teaching aid since the internet?\n\nAt Union of Genius, we believe the answer depends entirely on how we respond. Used passively, AI tools can short-circuit learning. Used actively and critically, they can democratise access to knowledge in ways that benefit Nigerian students enormously.\n\nWe have begun integrating AI literacy into our CodeGenius and Data Literacy programmes — teaching participants not just how to use these tools, but how they work, where they fail, and how to evaluate their outputs critically.\n\nThe opportunity is real. A student in Maiduguri with a smartphone and a ChatGPT account now has access to a patient, always-available tutor that can explain quantum physics, debug code, or help draft a business plan. For the millions of Nigerians who lack access to well-resourced schools, this is transformative.\n\nOur call to Nigeria's educators: do not ban it. Understand it, integrate it thoughtfully, and teach the next generation to be its masters — not its servants.",
    author: 'Dr. Ngozi Eze',
    created_at: '2025-05-08T10:00:00.000Z',
    status: 'live',
    bg_color: 'linear-gradient(135deg,var(--bg-card),var(--bg-mid))'
  },
  {
    id: 'static-2',
    emoji: '👩‍💻',
    category: 'Girls in Tech',
    title: 'From Kano to Cambridge: How UOG Changed My Life',
    excerpt: "Hauwa Garba was told coding was not for girls. Two years later, she's completing a computer science degree in the UK on a full scholarship.",
    content: "I grew up in Kano, the second daughter of a fabric trader and a primary school teacher. I loved mathematics and had always been curious about how computers worked — but when I told my secondary school teacher I wanted to study computer science, she laughed.\n\nIt was a Girls in Tech Nigeria flyer on a community centre notice board that changed everything. I attended the Port Harcourt event in 2022 on a whim — travelling six hours by bus with money I had saved from tutoring. I expected a lecture. What I found was a community.\n\nWithin six months of joining Union of Genius's Girls in Tech programme, I had built my first web application — a marketplace for Kano's small fabric traders. Within a year, I had received a full scholarship to study Computer Science at the University of Cambridge.\n\nI am not exceptional. I am what happens when a girl is given the right environment, the right mentors, and the simple message that she belongs.\n\nTo every girl in Nigeria who has been told that technology is not for her: it is for you. It was built for you to build with. Union of Genius showed me that, and I will spend the rest of my career showing others.",
    author: 'Hauwa Garba',
    created_at: '2025-04-22T10:00:00.000Z',
    status: 'live',
    bg_color: 'linear-gradient(135deg,var(--bg-card),#051a10)'
  },
  {
    id: 'static-3',
    emoji: '📜',
    category: 'Policy',
    title: "Nigeria's National Digital Literacy Framework: One Year On",
    excerpt: "A year after co-authoring the NDLF, we assess what's been implemented, what's been ignored, and what must happen next.",
    content: "In April 2022, Union of Genius co-authored the National Digital Literacy Framework alongside the Federal Ministry of Education, NITDA, and a coalition of civil society organisations.\n\nOne year on, the picture is mixed.\n\nWhat has worked: The Framework has been formally adopted as policy, and several state governments — notably Lagos, Ogun, and Kaduna — have begun integrating digital literacy benchmarks into their school curricula.\n\nWhat has stalled: Funding remains woefully inadequate. The Framework calls for a dedicated Digital Literacy Fund of N50 billion annually. Not a naira has been appropriated. Teacher training, arguably the most critical component, has proceeded at a fraction of the intended scale.\n\nWhat must happen next: Budget appropriation must follow policy aspiration. States must be given technical and financial support to implement — not just endorse — the Framework. And civil society must hold government accountable through public scorecards and relentless advocacy.\n\nUnion of Genius will publish its first NDLF Implementation Scorecard in June 2025.",
    author: 'Dr. Ngozi Eze',
    created_at: '2025-04-05T10:00:00.000Z',
    status: 'live',
    bg_color: 'linear-gradient(135deg,var(--bg-card),#1a1000)'
  },
  {
    id: 'static-4',
    emoji: '🔐',
    category: 'Cybersecurity',
    title: 'The Rise of Online Scams in Nigeria: What Every Family Should Know',
    excerpt: 'Romance scams, phishing, and fake investment platforms are costing Nigerians billions annually. Our guide to staying safe online.',
    content: "Nigeria loses an estimated N5 billion annually to online fraud — and that figure represents only reported cases. The true cost is far higher.\n\nThe scams have evolved. Where once they were clumsy emails promising inheritances, today's fraudsters deploy sophisticated social engineering: fake investment platforms with polished UIs, AI-generated romantic partners, WhatsApp groups that simulate genuine trading communities.\n\nThe most vulnerable are not the least educated. Union of Genius's CyberSafe Nigeria research found that professionals, civil servants, and university graduates are disproportionately targeted — their relative wealth making them attractive marks.\n\nHere is what every Nigerian family should know:\n\n1. No legitimate investment guarantees fixed returns. Any platform promising 30%, 50%, or 100% monthly returns is a scam.\n\n2. Your bank will never ask for your PIN, OTP, or full card number via phone, email, or WhatsApp.\n\n3. Verify before you transfer. Always confirm payment requests through a second channel — call the person directly on a known number.\n\n4. Enable two-factor authentication on every account that offers it.\n\n5. Report fraud. Contact the EFCC and the Nigeria Computer Emergency Response Team (ngCERT) at cert@cert.gov.ng.\n\nStaying safe online is not about being paranoid. It is about being informed.",
    author: 'Tunde Adeyemi',
    created_at: '2025-03-18T10:00:00.000Z',
    status: 'live',
    bg_color: 'linear-gradient(135deg,var(--bg-card),#0a1a2e)'
  },
  {
    id: 'static-5',
    emoji: '🌍',
    category: 'Digital Economy',
    title: "Why Nigeria Can Lead Africa's Digital Economy — But Only If We Act Now",
    excerpt: "Nigeria has the population, the talent, and the entrepreneurial spirit. What's missing? A breakdown of the digital infrastructure gap.",
    content: "By 2050, one in five Africans will be Nigerian. The median age of Nigeria's population is 18. The country produces more engineering graduates annually than most European nations combined.\n\nThe ingredients for digital leadership are all here. So why does Nigeria rank 120th globally on the ITU's ICT Development Index?\n\nThe answer is infrastructure — or rather, the absence of it. Broadband penetration sits at 45% nationally, but in rural areas it drops below 10%. The cost of 1GB of mobile data in Nigeria is 3x more expensive relative to average income than in South Africa.\n\nThis is not a funding problem alone. It is a policy alignment problem. Nigeria's various digital strategies exist largely in isolation, competing for the same scarce resources without coordination.\n\nWhat would it take to change this? Three things: a unified national digital infrastructure investment programme, mandatory digital literacy integration into the national curriculum from primary level, and a regulatory environment that incentivises — rather than taxes — digital innovation.\n\nNigeria's digital future is not inevitable. It is a choice. And the window to make the right one is narrowing.",
    author: 'Chukwuemeka Obi-Nwosu',
    created_at: '2025-03-02T10:00:00.000Z',
    status: 'live',
    bg_color: 'linear-gradient(135deg,var(--bg-card),#100a1a)'
  },
  {
    id: 'static-6',
    emoji: '📱',
    category: 'Digital Literacy',
    title: 'Teaching a 70-Year-Old to Use a Smartphone: Lessons from Our Enugu Programme',
    excerpt: 'Digital inclusion means every generation. Our community literacy facilitators share what they have learnt teaching seniors in Enugu.',
    content: "Chief Mrs Ngozi Okafor is 71 years old. She ran a successful provisions store in Enugu for four decades, raised six children, and has never, in her own words, had cause to use a computer.\n\nThat changed when her youngest son, who lives in Canada, suggested she learn to use a smartphone so they could video call. She enrolled in Union of Genius's Digital Literacy Day programme with what she described as academic terror.\n\nSix weeks later, she video-calls her son every Sunday morning, uses WhatsApp to coordinate her church's women's fellowship, checks her bank balance without queuing, and recently placed her first online shopping order.\n\nOur Enugu facilitators learnt as much from Chief Mrs Okafor and her peers as they taught. Here are their key lessons:\n\nPace matters more than content. Senior learners need more time per concept — not simpler concepts.\n\nContext is everything. Sending a WhatsApp message to your child is infinitely more motivating than open the messaging application.\n\nFear is the real barrier, not ability. The first session should be entirely about demystification — showing learners that mistakes are recoverable.\n\nDigital inclusion is not complete until it includes every generation. Union of Genius is committed to that completeness.",
    author: 'Emeka Okafor',
    created_at: '2025-02-14T10:00:00.000Z',
    status: 'live',
    bg_color: 'linear-gradient(135deg,var(--bg-card),#001510)'
  }
];

let _allBlogPosts = [...STATIC_BLOGS];

function escHtml(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function formatBlogDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch(e) { return ''; }
}

async function loadBlogPage() {
  const grid = document.getElementById('blog-dynamic-grid');
  if (!grid) return;

  // Show loading state
  grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px 0;color:var(--text-dim);font-family:var(--font-mono);font-size:0.75rem;letter-spacing:.1em;">LOADING ARTICLES…</div>';

  let dbPosts = [];
  try {
    const rows = await sbGetWhere('blogs', 'status', 'live');
    if (Array.isArray(rows) && rows.length > 0) {
      dbPosts = rows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      console.log('Loaded', dbPosts.length, 'blog post(s) from Supabase');
    }
  } catch(e) {
    console.warn('Could not fetch blog posts from Supabase:', e.message);
    // Static seeds will still show
  }

  // DB posts first, then static seeds
  _allBlogPosts = [...dbPosts, ...STATIC_BLOGS];

  grid.innerHTML = _allBlogPosts.map(post => {
    const bgStyle = post.bg_color || post.bgColor || 'linear-gradient(135deg,var(--bg-card),var(--bg-mid))';
    const safeId  = String(post.id).replace(/'/g, '');
    return '<div class="blog-card" style="cursor:pointer;" onclick="openArticle(\'' + safeId + '\')">'
      + '<div class="blog-img" style="background:' + bgStyle + ';">' + (post.emoji || '📝') + '</div>'
      + '<div class="blog-body">'
      + '<div class="blog-category">' + escHtml(post.category) + '</div>'
      + '<h3>' + escHtml(post.title) + '</h3>'
      + '<p>' + escHtml(post.excerpt) + '</p>'
      + '<div class="blog-meta"><span>' + escHtml(post.author) + '</span><span>' + formatBlogDate(post.created_at || post.createdAt) + '</span></div>'
      + '<div style="margin-top:14px;"><span style="font-size:0.82rem;color:var(--accent-green);font-weight:600;">Read full article →</span></div>'
      + '</div></div>';
  }).join('');
}

function openArticle(id) {
  const post = _allBlogPosts.find(p => String(p.id) === String(id));
  if (!post) return;

  const modal = document.getElementById('article-modal');
  const wrap  = document.getElementById('article-modal-body');
  const dateStr = formatBlogDate(post.created_at || post.createdAt);
  const authorInitial = (post.author || 'A').charAt(0);

  const paragraphs = (post.content || '').split(/\n\n+/).map(para =>
    '<p style="margin-bottom:20px;font-size:1rem;color:var(--text-muted);line-height:1.85;">'
    + escHtml(para.trim()).replace(/\n/g, '<br>') + '</p>'
  ).join('');

  wrap.innerHTML =
    '<div style="display:flex;align-items:center;gap:8px;margin-bottom:20px;">'
    + '<span style="font-family:var(--font-mono);font-size:0.65rem;letter-spacing:.12em;text-transform:uppercase;color:var(--accent-green);">' + escHtml(post.category) + '</span>'
    + '<span style="color:var(--text-dim);font-size:0.8rem;">·</span>'
    + '<span style="font-family:var(--font-mono);font-size:0.65rem;color:var(--text-dim);">' + dateStr + '</span>'
    + '</div>'
    + '<h2 style="font-family:var(--font-display);font-size:clamp(1.5rem,4vw,2.2rem);font-weight:800;letter-spacing:-0.02em;margin-bottom:20px;line-height:1.15;">' + escHtml(post.title) + '</h2>'
    + '<div style="display:flex;align-items:center;gap:12px;margin-bottom:32px;padding-bottom:24px;border-bottom:1px solid var(--border);">'
    + '<div style="width:38px;height:38px;border-radius:50%;background:var(--accent-green);display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-weight:800;font-size:0.8rem;color:var(--bg-deep);">' + escHtml(authorInitial) + '</div>'
    + '<div><div style="font-family:var(--font-display);font-size:0.9rem;font-weight:600;">' + escHtml(post.author) + '</div>'
    + '<div style="font-family:var(--font-mono);font-size:0.6rem;color:var(--text-muted);letter-spacing:.06em;">Union of Genius</div></div>'
    + '</div>'
    + paragraphs;

  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeArticle() {
  const modal = document.getElementById('article-modal');
  if (modal) modal.classList.remove('open');
  document.body.style.overflow = '';
}

// ──────────────────────────────────────
// COUNTER ANIMATION
// ──────────────────────────────────────
function animateCounters() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting || entry.target.dataset.animated) return;
      entry.target.dataset.animated = 'true';
      const target = parseInt(entry.target.dataset.target);
      const step   = target / (2000 / 16);
      let current  = 0;
      const timer  = setInterval(() => {
        current = Math.min(current + step, target);
        entry.target.textContent = Math.floor(current).toLocaleString() + (entry.target.dataset.suffix || '');
        if (current >= target) clearInterval(timer);
      }, 16);
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('[data-target]').forEach(el => observer.observe(el));
}

// ──────────────────────────────────────
// SCROLL REVEAL
// ──────────────────────────────────────
function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity   = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach(el => {
    el.style.opacity    = '0';
    el.style.transform  = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });
}

// ──────────────────────────────────────
// MARQUEE
// ──────────────────────────────────────
function initMarquee() {
  const track = document.querySelector('.marquee-track');
  if (!track) return;
  track.innerHTML += track.innerHTML;
}

// ──────────────────────────────────────
// EVENT CARD QUICK LINK
// ──────────────────────────────────────
function initEventCards() {
  document.querySelectorAll('.event-item[data-event]').forEach(card => {
    card.addEventListener('click', () => {
      const eventName = card.dataset.event;
      navigate('home');
      setTimeout(() => {
        const sel = document.getElementById('event-select');
        if (sel) {
          sel.value = eventName;
          sel.scrollIntoView({ behavior: 'smooth', block: 'center' });
          sel.style.boxShadow = '0 0 0 3px rgba(0,232,121,0.3)';
          setTimeout(() => sel.style.boxShadow = '', 2000);
        }
      }, 400);
    });
  });
}

// ──────────────────────────────────────
// INIT
// ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initMarquee();
  animateCounters();
  initScrollReveal();
  initEventCards();

  // Article modal — close on backdrop click or Escape
  const modal = document.getElementById('article-modal');
  if (modal) {
    modal.addEventListener('click', (e) => { if (e.target === modal) closeArticle(); });
  }
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeArticle(); });

  const hash = window.location.hash.replace('#', '') || 'home';
  navigate(hash);

  setTimeout(() => {
    initRegistrationForm();
    initContactForm();
  }, 100);

  window.addEventListener('popstate', () => {
    const page = window.location.hash.replace('#', '') || 'home';
    navigate(page);
  });
});
