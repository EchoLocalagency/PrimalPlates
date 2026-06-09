/* ============================================
   PRIMAL PLATES -- Main JS
   AOS init, mobile nav, smooth scroll, form
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  // --- AOS Init ---
  AOS.init({
    duration: 600,
    easing: 'ease-out',
    once: true,
    offset: 80,
  });

  // --- Navbar scroll effect ---
  const nav = document.querySelector('.nav');
  const scrollThreshold = 50;

  function handleNavScroll() {
    if (window.scrollY > scrollThreshold) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', handleNavScroll, { passive: true });
  handleNavScroll();

  // --- Mobile nav toggle ---
  const hamburger = document.querySelector('.hamburger');
  const mobileNav = document.querySelector('.mobile-nav');

  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      mobileNav.classList.toggle('open');
      document.body.style.overflow = mobileNav.classList.contains('open') ? 'hidden' : '';
    });

    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        mobileNav.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  // --- Smooth scroll for anchor links ---
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const navHeight = nav.offsetHeight;
        const targetPosition = target.getBoundingClientRect().top + window.scrollY - navHeight;
        window.scrollTo({ top: targetPosition, behavior: 'smooth' });
      }
    });
  });

  // --- Contact form ---
  const form = document.getElementById('order-form');
  const formContainer = document.getElementById('form-container');
  const formSuccess = document.getElementById('form-success');

  if (form) {
        // SPAM FILTER — kills SEO/web-design solicitation + review-buying submissions.
        // Patterns derived from real spam submissions to Arcadian + Mr Green inbox.
        const SPAM_PATTERNS = [
            // SEO/marketing agency pitches
            /\bseo\s+(services?|expert|agency|company|specialist|consultant|professional|firm)\b/i,
            /\b(white[\s-]?label|guest[\s-]?post|guest[\s-]?blogging|link[\s-]?building|backlinks?)\b/i,
            /\b(domain\s+authority|da\s+score|page\s+rank|first\s+page\s+of\s+google)\b/i,
            /\b(rank\s+(?:your|higher)|improve\s+your\s+ranking|increase\s+your\s+(?:traffic|leads|sales|ratings?))\b/i,
            /\b(optimize\s+(?:its|your|the)\s+ranking|optimize\s+(?:its|your|the)\s+seo)\b/i,
            /\b(digital\s+marketing\s+(?:agency|services?|expert|consultant)|outreach\s+(?:services?|campaign))\b/i,
            /\b(lead\s+generation\s+(?:services?|company|agency)|high[\s-]?quality\s+leads)\b/i,
            /\b(promote\s+your\s+(?:business|brand|website|company)|grow\s+your\s+(?:business|traffic|reach))\b/i,
            // Web design / web dev pitches
            /\b(web\s+(?:design|development)\s+(?:services?|company|agency|expert)|wordpress\s+(?:developer|expert))\b/i,
            /\b(mobile\s+app\s+(?:development|developer)|ui\/ux\s+(?:designer|services?))\b/i,
            /\b(audit\s+report|design[\s-]related\s+(?:issues?|problems?|errors?)|website['']?s?\s+(?:performance|design|ranking|seo|conversion|traffic))\b/i,
            /\b(proposal\s+(?:and|&)\s+pricing|detailed\s+(?:audit|proposal|report))\b/i,
            /\b(send\s+(?:you\s+)?a?\s*screenshot|send\s+(?:you\s+)?a?\s*proposal)\b/i,
            // Review-buying spam
            /\b(google|yelp|facebook|trustpilot|trustpaylot|bbb|houzz|tripadvisor|sitejabber|bark|qualibox|buildzoom|eldo|poch)\s+reviews?\b/i,
            /\b(negative\s+review\s+removal|review\s+removal\s+service|fake\s+reviews?)\b/i,
            /\b(high[\s-]?resolution\s+reviews?|verified\s+reviews?|5[\s-]?star\s+reviews?)\b/i,
            // Cold-email openers
            /\b(i\s+came\s+across\s+your|i\s+noticed\s+(?:your|a\s+few)|i\s+was\s+looking\s+at\s+your|i\s+stumbled\s+upon)\b/i,
            /\b(i\s+(?:am\s+)?reaching\s+out|we\s+(?:are|came\s+across)\s+your\s+website|hello\s+business\s+owner)\b/i,
            /\b(i\s+am\s+here\s+to\s+(?:promote|help|offer|introduce))\b/i,
            // Off-platform contact requests
            /\b(whats?app|telegram|skype|wechat|viber)[\s:.+]+(\+?\d|@)/i,
            /\b(\+?880|\+?91|\+?92|\+?234)[\s\-.]\d/,
            // Crypto / loan spam
            /\b(crypto|bitcoin|ethereum|nft|wallet\s+address|metamask|trustwallet)\b/i,
            /\b(payday\s+loan|business\s+loan\s+(?:offer|approval)|merchant\s+cash\s+advance)\b/i,
            // Bot greeting using site domain
            /\bhello\s+\S+\.com\b/i,
        ];

        function isSpam(form) {
            const fieldsToCheck = ['name', 'message', 'subject', 'email', 'company', 'full-name', 'fullName', 'comments', 'inquiry'];
            const combined = fieldsToCheck
                .map(n => (form.querySelector('[name="' + n + '"]') || {}).value || '')
                .join(' ');
            if (!combined.trim()) return false;
            for (const re of SPAM_PATTERNS) {
                if (re.test(combined)) return true;
            }
            const messageField = form.querySelector('[name="message"]') || form.querySelector('[name="comments"]') || form.querySelector('textarea');
            const message = (messageField || {}).value || '';
            const urlCount = (message.match(/https?:\/\//gi) || []).length;
            if (urlCount >= 2) return true;
            const name = (form.querySelector('[name="name"]') || form.querySelector('[name="full-name"]') || form.querySelector('[name="fullName"]') || {}).value || '';
            if (/https?:\/\//i.test(name)) return true;
            if (/\b(mkt|seo|digital|agency|marketing|outreach)\b/i.test(name) && name.length < 30) return true;
            const phoneField = form.querySelector('[name="phone"]');
            if (phoneField && phoneField.value) {
                const digits = phoneField.value.replace(/\D/g, '');
                if (digits.length >= 10 && /^(\d{3})\1\1/.test(digits)) return true;
            }
            const emojiCount = (message.match(/[\u{1F300}-\u{1FAFF}☀-➿\u{1F900}-\u{1F9FF}]/gu) || []).length;
            if (emojiCount >= 3) return true;
            return false;
        }

        function handleSpamSubmission(form, submitBtn) {
            try { console.warn('[spam-filter] submission blocked'); } catch (_) {}
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Sending...';
            }
            setTimeout(() => {
                window.location.href = '/';
            }, 1200);
        }

    form.addEventListener('submit', (e) => {
            // Spam pre-check
            if (isSpam(form)) {
                e.preventDefault();
                handleSpamSubmission(form, form.querySelector('button[type="submit"]'));
                return;
            }

      e.preventDefault();

      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());

      // For now, show success message (replace with actual endpoint later)
      console.log('Form submission:', data);

      formContainer.style.display = 'none';
      formSuccess.classList.add('show');

      // Reset after 5 seconds
      setTimeout(() => {
        formContainer.style.display = 'block';
        formSuccess.classList.remove('show');
        form.reset();
      }, 5000);
    });
  }

  // --- Lazy load images ---
  if ('IntersectionObserver' in window) {
    const lazyImages = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          imageObserver.unobserve(img);
        }
      });
    }, { rootMargin: '200px' });

    lazyImages.forEach(img => imageObserver.observe(img));
  }

});
