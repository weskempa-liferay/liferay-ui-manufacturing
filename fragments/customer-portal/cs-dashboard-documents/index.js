if (fragmentElement) {
  const docsList = fragmentElement.querySelector('.docs-list');
  const docItems = fragmentElement.querySelectorAll('.doc-item');
  let currentQuery = '';
  let currentFilter = 'all';

  // Create an empty state message dynamically if not present
  let emptyState = fragmentElement.querySelector('.docs-empty-state');
  if (!emptyState && docsList) {
    emptyState = document.createElement('li');
    emptyState.className = 'docs-empty-state';
    emptyState.style.display = 'none';
    emptyState.style.textAlign = 'center';
    emptyState.style.padding = '2rem';
    emptyState.style.color = '#6c757d';
    emptyState.textContent = 'No documents found matching your filters.';
    docsList.appendChild(emptyState);
  }

  const applyFilters = () => {
    let visibleCount = 0;

    docItems.forEach(item => {
      const text = item.textContent.toLowerCase();
      const matchesSearch = text.includes(currentQuery);
      
      let matchesType = true;
      if (currentFilter !== 'all') {
        // The values in the select match the class suffixes: bol, cert, invoice, ack
        const typeBadge = item.querySelector('.doc-type-badge');
        if (typeBadge) {
          // .doc-type-inv is used for invoice, .doc-type-cert for cert, etc.
          const isInv = currentFilter === 'invoice' && typeBadge.classList.contains('doc-type-inv');
          const isCert = currentFilter === 'cert' && typeBadge.classList.contains('doc-type-cert');
          const isBol = currentFilter === 'bol' && typeBadge.classList.contains('doc-type-bol');
          const isAck = currentFilter === 'ack' && typeBadge.classList.contains('doc-type-ack');
          
          matchesType = isInv || isCert || isBol || isAck;
        } else {
          matchesType = false;
        }
      }

      if (matchesSearch && matchesType) {
        item.style.display = '';
        visibleCount++;
      } else {
        item.style.display = 'none';
      }
    });

    if (emptyState) {
      emptyState.style.display = visibleCount === 0 ? 'block' : 'none';
    }
  };

  // Listen for the global search event dispatched by the header
  window.addEventListener('portalGlobalSearch', (e) => {
    currentQuery = (e.detail.query || '').toLowerCase();
    applyFilters();
  });

  // Listen for dropdown filter changes
  const filterSelect = fragmentElement.querySelector('.docs-filter-select');
  if (filterSelect) {
    filterSelect.addEventListener('change', (e) => {
      currentFilter = e.target.value;
      applyFilters();
    });
  }
}
