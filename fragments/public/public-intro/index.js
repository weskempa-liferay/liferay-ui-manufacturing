if (fragmentElement) {
  const animatedElements = fragmentElement.querySelectorAll('.video-card-frame, .culture-sidebar-card, .intro-quote-card');

  if ('IntersectionObserver' in window && animatedElements.length > 0) {
    // Initial invisible states via JavaScript to allow graceful fallback if JS is disabled
    animatedElements.forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(30px)';
      el.style.transition = 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
    });

    const observerOptions = {
      root: null,
      threshold: 0.15,
      rootMargin: '0px'
    };

    const observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const target = entry.target;
          target.style.opacity = '1';
          target.style.transform = 'translateY(0)';
          observer.unobserve(target); // Stop tracking after it is revealed
        }
      });
    }, observerOptions);

    animatedElements.forEach(el => {
      observer.observe(el);
    });
  }
}
