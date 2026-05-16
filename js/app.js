// ===== UNION OF GENIUS — APP.JS =====

// ──────────────────────────────────────
// LOCAL DATABASE (IndexedDB)
// ──────────────────────────────────────
const DB_NAME = 'UnionOfGeniusDB';
const DB_VERSION = 1;
let db;

function initDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const database = e.target.result;
      if (!database.objectStoreNames.contains('registrations')) {
        const store = database.createObjectStore('registrations', { keyPath: 'id', autoIncrement: true });
        store.createIndex('email', 'email', { unique: false });
        store.createIndex('event', 'event', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
      if (!database.objectStoreNames.contains('contacts')) {
        const cStore = database.createObjectStore('contacts', { keyPath: 'id', autoIncrement: true });
        cStore.createIndex('email', 'email', { unique: false });
      }
    };
    req.onsuccess = (e) => { db = e.target.result; resolve(db); };
    req.onerror = (e) => reject(e.target.error);
  });
}

function saveRegistration(data) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('registrations', 'readwrite');
    const store = tx.objectStore('registrations');
    const req = store.add({ ...data, timestamp: new Date().toISOString() });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function saveContact(data) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('contacts', 'readwrite');
    const store = tx.objectStore('contacts');
    const req = store.add({ ...data, timestamp: new Date().toISOString() });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function getAllRegistrations() {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('registrations', 'readonly');
    const store = tx.objectStore('registrations');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// ──────────────────────────────────────
// PAGE ROUTING
// ──────────────────────────────────────
function navigate(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById(`page-${pageId}`);
  if (target) {
    target.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  // Update nav active state
  document.querySelectorAll('.nav-links a, .mobile-nav a').forEach(a => {
    a.classList.toggle('active', a.dataset.page === pageId);
  });
  // Close mobile nav
  closeMobileNav();
  // Update URL hash for bookmarking
  history.pushState({}, '', `#${pageId}`);
}

// ──────────────────────────────────────
// NAVIGATION
// ──────────────────────────────────────
function initNav() {
  const nav = document.querySelector('nav');
  const hamburger = document.querySelector('.hamburger');
  const mobileNav = document.querySelector('.mobile-nav');

  // Scroll effect
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 20);
  });

  // Hamburger toggle
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    mobileNav.classList.toggle('open');
  });

  // Nav link clicks
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
      firstName: form.firstName.value.trim(),
      lastName: form.lastName.value.trim(),
      email: form.email.value.trim(),
      phone: form.phone.value.trim(),
      organization: form.organization.value.trim(),
      state: form.state.value,
      event: form.event.value,
      experience: form.experience.value,
      motivation: form.motivation.value.trim(),
      newsletter: form.newsletter.checked,
    };

    try {
      const id = await saveRegistration(data);
      // Show success
      form.style.display = 'none';
      const success = document.getElementById('reg-success');
      success.style.display = 'block';
      success.querySelector('.reg-id').textContent = `REG-UOG-${String(id).padStart(5, '0')}`;
      showDBNotification('Registration saved to your local database!');
    } catch (err) {
      console.error('Registration error:', err);
      btn.textContent = 'Submit Registration';
      btn.disabled = false;
      alert('An error occurred. Please try again.');
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
      name: form.contactName.value.trim(),
      email: form.contactEmail.value.trim(),
      subject: form.contactSubject.value.trim(),
      message: form.contactMessage.value.trim(),
    };

    try {
      await saveContact(data);
      form.reset();
      btn.textContent = 'Message Sent! ✓';
      btn.style.background = 'var(--accent-green)';
      btn.style.color = 'var(--bg-deep)';
      showDBNotification('Your message saved locally. We\'ll respond soon!');
      setTimeout(() => {
        btn.textContent = 'Send Message';
        btn.style.background = '';
        btn.style.color = '';
        btn.disabled = false;
      }, 4000);
    } catch (err) {
      btn.textContent = 'Send Message';
      btn.disabled = false;
    }
  });
}

// ──────────────────────────────────────
// DB NOTIFICATION TOAST
// ──────────────────────────────────────
function showDBNotification(message) {
  const notif = document.getElementById('db-notification');
  if (!notif) return;
  notif.querySelector('p').textContent = message;
  notif.classList.add('show');
  setTimeout(() => notif.classList.remove('show'), 4000);
}

// ──────────────────────────────────────
// COUNTER ANIMATION
// ──────────────────────────────────────
function animateCounters() {
  const counters = document.querySelectorAll('[data-target]');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting || entry.target.dataset.animated) return;
      entry.target.dataset.animated = 'true';
      const target = parseInt(entry.target.dataset.target);
      const duration = 2000;
      const step = target / (duration / 16);
      let current = 0;
      const timer = setInterval(() => {
        current = Math.min(current + step, target);
        const suffix = entry.target.dataset.suffix || '';
        entry.target.textContent = Math.floor(current).toLocaleString() + suffix;
        if (current >= target) clearInterval(timer);
      }, 16);
    });
  }, { threshold: 0.5 });

  counters.forEach(el => observer.observe(el));
}

// ──────────────────────────────────────
// SCROLL REVEAL
// ──────────────────────────────────────
function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.reveal').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });
}

// ──────────────────────────────────────
// MARQUEE DUPLICATION
// ──────────────────────────────────────
function initMarquee() {
  const track = document.querySelector('.marquee-track');
  if (!track) return;
  track.innerHTML += track.innerHTML;
}

// ──────────────────────────────────────
// EVENT REGISTRATION QUICK LINK
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
document.addEventListener('DOMContentLoaded', async () => {
  // Init IndexedDB
  try {
    await initDB();
    console.log('✅ UnionOfGenius DB ready on your device');
  } catch (err) {
    console.warn('IndexedDB init failed:', err);
  }

  initNav();
  initMarquee();
  animateCounters();
  initScrollReveal();
  initEventCards();

  // Handle initial route
  const hash = window.location.hash.replace('#', '') || 'home';
  navigate(hash);

  // Register form
  setTimeout(() => {
    initRegistrationForm();
    initContactForm();
  }, 100);

  // Handle browser back/forward
  window.addEventListener('popstate', () => {
    const page = window.location.hash.replace('#', '') || 'home';
    navigate(page);
  });
});
