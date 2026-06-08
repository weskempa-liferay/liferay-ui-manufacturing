if (fragmentElement) {
  // Event delegation for dismiss buttons
  const alertsList = fragmentElement.querySelector('.alerts-list');

  if (alertsList) {
    alertsList.addEventListener('click', (e) => {
      const dismissBtn = e.target.closest('.alert-dismiss');
      if (dismissBtn) {
        e.preventDefault();
        const alertItem = dismissBtn.closest('.alert-item');
        if (alertItem) {
          alertItem.style.transition = 'opacity 0.3s ease, max-height 0.3s ease, padding 0.3s ease';
          alertItem.style.opacity = '0';
          alertItem.style.maxHeight = '0';
          alertItem.style.padding = '0 1.75rem';
          alertItem.style.overflow = 'hidden';
          setTimeout(() => alertItem.remove(), 300);
        }
      }
    });
  }
}
