if (fragmentElement) {
  const container = fragmentElement.querySelector('#rs-timeline-container');
  const detailPanel = fragmentElement.querySelector('#rs-detail-panel');
  const detailTitle = fragmentElement.querySelector('#rs-detail-title');
  const detailContent = fragmentElement.querySelector('#rs-detail-content');
  const closeBtn = fragmentElement.querySelector('#rs-close-btn');
  const searchInput = fragmentElement.querySelector('#rs-size-filter');

  let activeWeekIndex = -1;
  let currentFilter = '';
  let timelineData = [];

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  };

  const renderTimeline = () => {
    container.innerHTML = '';
    
    if (timelineData.length === 0) {
      container.innerHTML = '<div style="padding: 1rem; width: 100%; text-align: center; color: #6c757d;">No scheduling data found.</div>';
      return;
    }

    timelineData.forEach((week, index) => {
      const card = document.createElement('div');
      card.className = `rs-week-card ${week.inOperation ? '' : 'disabled'} ${index === activeWeekIndex ? 'active' : ''}`;
      card.dataset.index = index;

      const dateSpan = document.createElement('span');
      dateSpan.className = 'rs-week-date';
      dateSpan.textContent = week.date;

      const countSpan = document.createElement('span');
      countSpan.className = 'rs-week-count';
      countSpan.textContent = week.inOperation ? `${week.sizes.length} Sizes` : 'Offline';

      card.appendChild(dateSpan);
      card.appendChild(countSpan);
      container.appendChild(card);
    });
    applyFilterHighlight();
  };

  const renderDetail = (index) => {
    activeWeekIndex = index;
    const week = timelineData[index];
    
    // Update active class on timeline
    Array.from(container.children).forEach((child, i) => {
      child.classList.toggle('active', i === index);
    });

    detailTitle.textContent = `Scheduled Sizes for Week of ${week.date}`;
    detailContent.innerHTML = '';

    if (week.sizes.length === 0) {
      detailContent.innerHTML = '<div style="grid-column: 1 / -1; color: #6c757d; font-size: 0.875rem;">No sizes scheduled for this week.</div>';
    } else {
      week.sizes.forEach(size => {
        const pill = document.createElement('div');
        pill.className = 'rs-size-pill';
        pill.textContent = size;
        detailContent.appendChild(pill);
      });
    }

    detailPanel.style.display = 'block';
    applyFilterHighlight();
  };

  const applyFilterHighlight = () => {
    const term = currentFilter.trim().toLowerCase();
    
    // Highlight timeline cards
    Array.from(container.children).forEach((card, index) => {
      if (!timelineData[index].inOperation) return;
      
      const hasMatch = term && timelineData[index].sizes.some(s => s.toLowerCase().includes(term));
      card.classList.toggle('highlight', !!hasMatch);
    });

    // Highlight detail pills if open
    if (activeWeekIndex > -1 && detailPanel.style.display !== 'none') {
      Array.from(detailContent.children).forEach(pill => {
        const isMatch = term && pill.textContent.toLowerCase().includes(term);
        pill.classList.toggle('match', !!isMatch);
      });
    }
  };

  const fetchMatrixData = async () => {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (window.Liferay && Liferay.authToken) {
        headers['x-csrf-token'] = Liferay.authToken;
      }

      // We request nestedFields=rollWeekToScheduledSizes (Liferay's standard naming convention for relationships)
      // or similar if the exact relationship name differs.
      // We will also use pageSize=50 to grab a large chunk of weeks.
      const url = '/o/c/rollweeks/?sort=weekStartDate:asc&pageSize=50&nestedFields=rollWeekToScheduledSizes,rollWeekToScheduledSize';
      const response = await fetch(url, { headers });
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const json = await response.json();
      
      // Filter by facility scope if configured
      const targetFacility = configuration.facilityScope || 'SKV';
      let filteredData = json.items;
      
      if (targetFacility !== 'ALL') {
        filteredData = json.items.filter(item => {
          const facValue = item.facilityCode?.key || item.facilityCode?.name || item.facilityCode;
          return typeof facValue === 'string' && facValue.toUpperCase() === targetFacility.toUpperCase();
        });
      }

      // Map to frontend timelineData format
      timelineData = filteredData.map(item => {
        // Handle possible relationship array names
        const nestedSizesArray = item.rollWeekToScheduledSizes || item.rollWeekToScheduledSize || [];
        
        // Sort sizes by sequenceOrder if available, otherwise alphabetical
        nestedSizesArray.sort((a, b) => {
          if (a.sequenceOrder && b.sequenceOrder) return a.sequenceOrder - b.sequenceOrder;
          return a.sizeValue.localeCompare(b.sizeValue);
        });

        const sizes = nestedSizesArray.map(sz => sz.sizeValue);

        return {
          date: formatDate(item.weekStartDate),
          inOperation: item.millInOperation,
          sizes: sizes
        };
      });

      renderTimeline();

    } catch (error) {
      console.error('Error fetching rolling sizes matrix data:', error);
      if (container) {
        container.innerHTML = '<div style="padding: 1rem; width: 100%; text-align: center; color: #e03131;">Error loading scheduling data.</div>';
      }
    }
  };

  // Event Listeners
  if (container) {
    container.addEventListener('click', (e) => {
      const card = e.target.closest('.rs-week-card');
      if (card && !card.classList.contains('disabled')) {
        renderDetail(parseInt(card.dataset.index, 10));
      }
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      detailPanel.style.display = 'none';
      activeWeekIndex = -1;
      Array.from(container.children).forEach(child => child.classList.remove('active'));
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentFilter = e.target.value;
      applyFilterHighlight();
    });
  }

  // Initial render / fetch
  fetchMatrixData();
}
