if (fragmentElement) {
  // Mock Data generation matching the spreadsheet dates and legend logic
  const mockHeatmapData = [
    { date: "5/31/26", capacity: 100 }, // Closed
    { date: "6/7/26",  capacity: 100 }, // Closed
    { date: "6/14/26", capacity: 95 },  // Urgent (85-99.9)
    { date: "6/21/26", capacity: 80 },  // OK (70-84.9)
    { date: "6/28/26", capacity: 75 },  // OK (70-84.9)
    { date: "7/5/26",  capacity: 100 }, // Closed (holiday/shutdown)
    { date: "7/12/26", capacity: 72 },  // OK (70-84.9)
    { date: "7/19/26", capacity: 65 },  // Open (< 70)
    { date: "7/26/26", capacity: 60 },  // Open
    { date: "8/2/26",  capacity: 55 },  // Open
    { date: "8/9/26",  capacity: 40 },  // Open
    { date: "8/16/26", capacity: 68 },  // Open
    { date: "8/23/26", capacity: 50 },  // Open
    { date: "8/30/26", capacity: 62 },  // Open
    { date: "9/6/26",  capacity: 69 },  // Open
    { date: "9/13/26", capacity: 50 },  // Open
    { date: "9/20/26", capacity: 45 }   // Open
  ];

  const getTier = (capacity) => {
    if (capacity >= 100) return 'closed';
    if (capacity >= 85) return 'urgent';
    if (capacity >= 70) return 'ok';
    return 'open';
  };

  const gridBody = fragmentElement.querySelector('#hm-grid-body');
  const tooltip = fragmentElement.querySelector('#hm-tooltip');
  const legend = fragmentElement.querySelector('#hm-legend');

  // Render Grid
  if (gridBody) {
    gridBody.innerHTML = '';
    mockHeatmapData.forEach(item => {
      const tier = getTier(item.capacity);
      
      const row = document.createElement('div');
      row.className = `hm-row hm-tier-${tier}`;
      
      const dateCell = document.createElement('div');
      dateCell.className = 'hm-date-cell';
      dateCell.textContent = item.date;
      
      const statusCell = document.createElement('div');
      statusCell.className = `hm-status-cell bg-${tier}`;
      statusCell.dataset.capacity = item.capacity;
      statusCell.dataset.date = item.date;
      statusCell.setAttribute('aria-label', `${item.capacity}% full for week of ${item.date}`);
      
      row.appendChild(dateCell);
      row.appendChild(statusCell);
      gridBody.appendChild(row);
    });
  }

  // Tooltip Interaction
  if (gridBody && tooltip) {
    gridBody.addEventListener('mouseover', (e) => {
      if (e.target.classList.contains('hm-status-cell')) {
        const capacity = e.target.dataset.capacity;
        let label = capacity >= 100 ? "Closed/Maintenance" : `${capacity}% Full`;
        
        tooltip.textContent = label;
        tooltip.style.display = 'block';
        
        const rect = e.target.getBoundingClientRect();
        
        // Position fixed tooltip
        tooltip.style.top = `${rect.top - 5}px`;
        tooltip.style.left = `${rect.left + (rect.width / 2)}px`;
      }
    });

    gridBody.addEventListener('mouseout', (e) => {
      if (e.target.classList.contains('hm-status-cell')) {
        tooltip.style.display = 'none';
      }
    });
  }

  // Legend Hover Interaction (Fade out non-matching tiers)
  if (legend && gridBody) {
    legend.addEventListener('mouseover', (e) => {
      const legendItem = e.target.closest('.hm-legend-item');
      if (legendItem) {
        const targetTier = legendItem.dataset.tier;
        Array.from(gridBody.children).forEach(row => {
          if (!row.classList.contains(`hm-tier-${targetTier}`)) {
            row.classList.add('fade-out');
          }
        });
      }
    });

    legend.addEventListener('mouseout', (e) => {
      const legendItem = e.target.closest('.hm-legend-item');
      if (legendItem) {
        Array.from(gridBody.children).forEach(row => {
          row.classList.remove('fade-out');
        });
      }
    });
  }
}
