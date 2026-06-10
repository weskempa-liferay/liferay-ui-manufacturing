if (fragmentElement) {
  const gridBody = fragmentElement.querySelector('#hm-grid-body');
  const tooltip = fragmentElement.querySelector('#hm-tooltip');
  const legend = fragmentElement.querySelector('#hm-legend');
  const targetFacility = configuration.facilityName || 'Saukville';

  const getTier = (capacity) => {
    if (capacity >= 100) return 'closed';
    if (capacity >= 85) return 'urgent';
    if (capacity >= 70) return 'ok';
    return 'open';
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    // Add timezone offset to prevent off-by-one day issues
    date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear().toString().substr(-2)}`;
  };

  const renderGrid = (data) => {
    gridBody.innerHTML = '';
    
    if (data.length === 0) {
      gridBody.innerHTML = '<div style="padding: 1rem; text-align: center; color: #6c757d; font-size: 0.875rem;">No capacity data found for this facility.</div>';
      return;
    }

    data.forEach(item => {
      const tier = getTier(item.capacityPercentage);
      const friendlyDate = formatDate(item.weekStartDate);
      
      const row = document.createElement('div');
      row.className = `hm-row hm-tier-${tier}`;
      
      const dateCell = document.createElement('div');
      dateCell.className = 'hm-date-cell';
      dateCell.textContent = friendlyDate;
      
      const statusCell = document.createElement('div');
      statusCell.className = `hm-status-cell bg-${tier}`;
      statusCell.dataset.capacity = item.capacityPercentage;
      statusCell.dataset.date = friendlyDate;
      statusCell.setAttribute('aria-label', `${item.capacityPercentage}% full for week of ${friendlyDate}`);
      
      row.appendChild(dateCell);
      row.appendChild(statusCell);
      gridBody.appendChild(row);
    });
  };

  const fetchHeatmapData = async () => {
    try {
      // CSRF token is required for authenticated Headless API calls
      const headers = {
        'Content-Type': 'application/json',
      };
      if (window.Liferay && Liferay.authToken) {
        headers['x-csrf-token'] = Liferay.authToken;
      }

      // Fetch Roll Weeks and sort by date ascending
      const response = await fetch('/o/c/rollweeks/?sort=weekStartDate:asc&pageSize=50', { headers });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const json = await response.json();
      
      // Filter by facility (client-side to handle complex Picklist structures gracefully)
      const filteredData = json.items.filter(item => {
        const facValue = item.facilityCode.key || item.facilityCode.name || item.facilityCode;
        return typeof facValue === 'string' && (facValue.toLowerCase() === targetFacility.toLowerCase() || facValue.toLowerCase() === 'skv' && targetFacility.toLowerCase() === 'saukville' || facValue.toLowerCase() === 'cle' && targetFacility.toLowerCase() === 'cleveland');
      });

      renderGrid(filteredData);

    } catch (error) {
      console.error('Error fetching capacity data:', error);
      if (gridBody) {
        gridBody.innerHTML = '<div style="padding: 1rem; text-align: center; color: #e03131; font-size: 0.875rem;">Error loading data.</div>';
      }
    }
  };

  // Tooltip Interaction
  if (gridBody && tooltip) {
    gridBody.addEventListener('mouseover', (e) => {
      if (e.target.classList.contains('hm-status-cell')) {
        const capacity = parseInt(e.target.dataset.capacity, 10);
        let label = capacity >= 100 ? "Closed/Maintenance" : `${capacity}% Full`;
        
        tooltip.textContent = label;
        tooltip.style.display = 'block';
        
        const rect = e.target.getBoundingClientRect();
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

  // Initial Fetch
  fetchHeatmapData();
}
