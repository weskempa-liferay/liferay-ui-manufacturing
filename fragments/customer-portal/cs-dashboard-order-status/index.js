if (fragmentElement) {
  const filterTabs = fragmentElement.querySelectorAll('.filter-tab');
  const rows = fragmentElement.querySelectorAll('.orders-tbody tr');

  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Update active tab
      filterTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const filter = tab.getAttribute('data-filter');

      rows.forEach(row => {
        if (filter === 'all') {
          row.style.display = '';
        } else {
          const type = row.getAttribute('data-product-type');
          row.style.display = (type === filter) ? '' : 'none';
        }
      });
    });
  });

  // Listen for roll-week filter events from the roll-week fragment
  window.addEventListener('filterByRollWeek', (e) => {
    const targetWeek = e.detail && e.detail.week;
    if (!targetWeek) return;

    filterTabs.forEach(t => t.classList.remove('active'));
    filterTabs[0].classList.add('active'); // Reset to "All"

    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      const weekCell = cells[5]; // Roll Week column
      if (weekCell) {
        const weekText = weekCell.textContent.trim();
        row.style.display = (weekText === targetWeek) ? '' : 'none';
      }
    });
  });
}
