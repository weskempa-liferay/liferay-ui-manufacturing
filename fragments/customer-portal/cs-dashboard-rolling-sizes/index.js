if (fragmentElement) {
  // Mock Data generation based on spreadsheet
  const generateMockData = () => {
    const data = [];
    let currentDate = new Date(2026, 4, 31); // May 31, 2026

    const sampleSizes = ["17/32", "45/64", "33/64", "9/16", "27/64", "29/64", "21/64", "23/64", "19/64", "7/32", "15/64", "5.5MM", "14.5MM", "1/4", "11/16", "37/64", "6.5MM", "35/64", "15/32", "7/16", "3/8", "8.5MM", "3/4", "11/32", "39/64", "9/32", "31/64", "25/32", "5/8", "16MM", "5/16", "12.5MM", "51/64", "1/2", "41/64", "13/32", "13/16", "47/64", "21/32", "19/32", "53/64", "49/64", "27/32", "31/32", "43/64", "63/64", "55/64", "1", "7/8", "25.6MM", "57/64", "1-1/64", "29/32", "1-1/32", "59/64", "1-3/64", "15/16", "1-1/16", "61/64", "1-5/64", "1-15/64", "1-11/32", "1-3/32", "1-1/4", "1-23/64", "1-7/64", "1-17/64", "1-3/8", "1-1/8", "1-9/32", "1-19/64", "1-5/16", "1-21/64", "1-5/32", "1-11/64", "1-3/16", "1-13/64", "1-7/32"];

    for (let i = 0; i < 16; i++) {
      // Format date like "5/31/2026"
      const dateStr = `${currentDate.getMonth() + 1}/${currentDate.getDate()}/${currentDate.getFullYear()}`;
      
      // Week 5 (7/5/2026) is shutdown
      const inOp = i !== 5;
      
      // Select a random subset of sizes if in operation
      let sizes = [];
      if (inOp) {
        const numSizes = Math.floor(Math.random() * 20) + 15; // 15 to 35 sizes
        // Shuffle and slice
        sizes = [...sampleSizes].sort(() => 0.5 - Math.random()).slice(0, numSizes);
        // Sort sizes alphabetically for display
        sizes.sort();
      }

      data.push({
        date: dateStr,
        inOperation: inOp,
        sizes: sizes
      });

      // Add 7 days
      currentDate.setDate(currentDate.getDate() + 7);
    }
    return data;
  };

  const timelineData = generateMockData();
  const container = fragmentElement.querySelector('#rs-timeline-container');
  const detailPanel = fragmentElement.querySelector('#rs-detail-panel');
  const detailTitle = fragmentElement.querySelector('#rs-detail-title');
  const detailContent = fragmentElement.querySelector('#rs-detail-content');
  const closeBtn = fragmentElement.querySelector('#rs-close-btn');
  const searchInput = fragmentElement.querySelector('#rs-size-filter');

  let activeWeekIndex = -1;
  let currentFilter = '';

  const renderTimeline = () => {
    container.innerHTML = '';
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

    week.sizes.forEach(size => {
      const pill = document.createElement('div');
      pill.className = 'rs-size-pill';
      pill.textContent = size;
      detailContent.appendChild(pill);
    });

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

  // Initial render
  if (container) {
    renderTimeline();
  }
}
