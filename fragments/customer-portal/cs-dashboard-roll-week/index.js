if (fragmentElement) {
  const weeks = fragmentElement.querySelectorAll('.rw-week');

  // Animate bars on load
  weeks.forEach(week => {
    const bars = week.querySelectorAll('.rw-bar');
    bars.forEach(bar => {
      const target = bar.style.width;
      bar.style.width = '0%';
      setTimeout(() => {
        bar.style.width = target;
      }, 200);
    });
  });

  // Click to dispatch filter event and toggle selected state
  weeks.forEach(week => {
    week.addEventListener('click', () => {
      const weekId = week.getAttribute('data-week');

      // Toggle selected state
      const wasSelected = week.classList.contains('rw-week-selected');
      weeks.forEach(w => w.classList.remove('rw-week-selected'));

      if (!wasSelected) {
        week.classList.add('rw-week-selected');
        window.dispatchEvent(new CustomEvent('filterByRollWeek', {
          detail: { week: weekId }
        }));
      } else {
        // Deselect — clear filter
        window.dispatchEvent(new CustomEvent('filterByRollWeek', {
          detail: { week: null }
        }));
      }
    });
  });
}
