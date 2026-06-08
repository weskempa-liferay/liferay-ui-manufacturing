if (fragmentElement) {
  // KPI cards are static/editable — no dynamic logic needed.
  // Add subtle entrance animation
  const cards = fragmentElement.querySelectorAll('.kpi-card');
  cards.forEach((card, i) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(12px)';
    card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    setTimeout(() => {
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    }, 100 + i * 80);
  });
}
