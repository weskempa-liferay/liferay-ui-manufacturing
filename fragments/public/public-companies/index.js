if (fragmentElement) {
  const cards = fragmentElement.querySelectorAll('.company-card');

  if (cards.length > 0) {
    cards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        // Calculate coordinate offsets relative to the card element
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Set CSS variables that will be used by radial-gradient in CSS
        card.style.setProperty('--x', `${x}px`);
        card.style.setProperty('--y', `${y}px`);
      });
    });
  }
}
