if (fragmentElement) {
  const searchInput = fragmentElement.querySelector('.dash-search-input');

  if (searchInput) {
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const term = searchInput.value.trim();
        if (term) {
          window.dispatchEvent(new CustomEvent('portalGlobalSearch', {
            detail: { query: term }
          }));
        }
      }
    });
  }
}
