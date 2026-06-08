if (fragmentElement) {
  const bgImage = fragmentElement.querySelector('.hero-bg-image');

  if (bgImage) {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const rect = fragmentElement.getBoundingClientRect();
          const viewHeight = window.innerHeight;

          // Only calculate if the fragment is in the viewport
          if (rect.top < viewHeight && rect.bottom > 0) {
            const scrolledRatio = Math.max(0, Math.min(1, (viewHeight - rect.top) / (viewHeight + rect.height)));
            // Translate the background image slightly on scroll (parallax effect)
            const translateY = (scrolledRatio - 0.5) * 40; // max 20px up or down
            bgImage.style.transform = `scale(1.05) translateY(${translateY}px)`;
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    // Register event listener with passive option for performance
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Initial positioning
    handleScroll();
  }
}
