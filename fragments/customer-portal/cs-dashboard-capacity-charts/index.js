if (fragmentElement) {
  const tooltip = fragmentElement.querySelector('#chart-tooltip');
  const chartsContainer = fragmentElement.querySelector('.cs-capacity-charts');

  // Animate bars on load
  const bars = fragmentElement.querySelectorAll('.chart-bar');
  bars.forEach(bar => {
    const targetHeight = bar.style.height;
    bar.style.height = '0%';
    setTimeout(() => {
      bar.style.height = targetHeight;
    }, 150);
  });

  // Event Delegation for tooltip
  if (chartsContainer && tooltip) {
    chartsContainer.addEventListener('mouseover', (e) => {
      if (e.target.classList.contains('chart-bar')) {
        const val = e.target.getAttribute('data-val');
        const monthLabel = e.target.closest('.chart-bar-col').querySelector('.chart-x-label').textContent;
        const plantName = e.target.classList.contains('bar-saukville') ? 'Saukville' : 'Cleveland';
        
        tooltip.textContent = `${plantName} - ${monthLabel}: ${val}`;
        tooltip.style.display = 'block';
        
        // Position tooltip
        const rect = e.target.getBoundingClientRect();
        const containerRect = chartsContainer.getBoundingClientRect();
        
        const top = rect.top - containerRect.top;
        const left = rect.left - containerRect.left + (rect.width / 2);
        
        tooltip.style.top = `${top}px`;
        tooltip.style.left = `${left}px`;
      }
    });

    chartsContainer.addEventListener('mouseout', (e) => {
      if (e.target.classList.contains('chart-bar')) {
        tooltip.style.display = 'none';
      }
    });
  }
}
