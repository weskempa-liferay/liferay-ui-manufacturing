if (fragmentElement) {
  const chartContainer = fragmentElement.querySelector('#rw-chart-container');

  const formatDateLabel = (isoString) => {
    const date = new Date(isoString);
    date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
    const month = date.toLocaleString('en-US', { month: 'short' });
    return `${month} ${date.getDate()}`;
  };

  const renderChart = (groupedData) => {
    if (!chartContainer) return;
    chartContainer.innerHTML = '';

    const dates = Object.keys(groupedData).sort((a, b) => new Date(a) - new Date(b));

    // Limit to next 24 weeks if there is a lot of data to keep UI clean
    const datesToRender = dates.slice(0, 24);

    if (datesToRender.length === 0) {
      chartContainer.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: #64748b;">No capacity data available.</div>';
      return;
    }

    datesToRender.forEach((dateString, index) => {
      const dataForDate = groupedData[dateString];
      
      const skvCap = dataForDate['SKV'] || 0;
      const cleCap = dataForDate['CLE'] || 0;
      const friendlyDate = formatDateLabel(dateString);

      // Create week container
      const weekDiv = document.createElement('div');
      weekDiv.className = 'rw-week';
      weekDiv.dataset.week = dateString; // Store the ISO date for filtering

      // Label (WK 1, WK 2...)
      const labelDiv = document.createElement('div');
      labelDiv.className = 'rw-week-label';
      labelDiv.textContent = `WK ${index + 1}`;

      // Bars
      const barsDiv = document.createElement('div');
      barsDiv.className = 'rw-bars';

      // SKV Bar
      const skvTrack = document.createElement('div');
      skvTrack.className = 'rw-bar-track';
      const skvBar = document.createElement('div');
      skvBar.className = `rw-bar rw-bar-saukville ${skvCap > 90 ? 'rw-bar-high' : ''}`;
      skvBar.style.width = '0%'; // Start at 0 for animation
      skvBar.dataset.pct = skvCap;
      skvTrack.appendChild(skvBar);

      // CLE Bar
      const cleTrack = document.createElement('div');
      cleTrack.className = 'rw-bar-track';
      const cleBar = document.createElement('div');
      cleBar.className = `rw-bar rw-bar-cleveland ${cleCap > 90 ? 'rw-bar-high' : ''}`;
      cleBar.style.width = '0%'; // Start at 0 for animation
      cleBar.dataset.pct = cleCap;
      cleTrack.appendChild(cleBar);

      barsDiv.appendChild(skvTrack);
      barsDiv.appendChild(cleTrack);

      // Date string
      const dateDiv = document.createElement('div');
      dateDiv.className = 'rw-week-date';
      dateDiv.textContent = friendlyDate;

      // Assemble
      weekDiv.appendChild(labelDiv);
      weekDiv.appendChild(barsDiv);
      weekDiv.appendChild(dateDiv);

      chartContainer.appendChild(weekDiv);

      // Animate after a tiny delay
      setTimeout(() => {
        skvBar.style.width = `${skvCap}%`;
        cleBar.style.width = `${cleCap}%`;
      }, 50 * index); // Staggered animation
    });

    attachClickListeners();
  };

  const attachClickListeners = () => {
    const weeks = chartContainer.querySelectorAll('.rw-week');
    weeks.forEach(week => {
      week.addEventListener('click', () => {
        const weekDate = week.getAttribute('data-week');

        const wasSelected = week.classList.contains('rw-week-selected');
        weeks.forEach(w => w.classList.remove('rw-week-selected'));

        if (!wasSelected) {
          week.classList.add('rw-week-selected');
          window.dispatchEvent(new CustomEvent('filterByRollWeek', {
            detail: { week: weekDate }
          }));
        } else {
          window.dispatchEvent(new CustomEvent('filterByRollWeek', {
            detail: { week: null }
          }));
        }
      });
    });
  };

  const fetchRollWeekData = async () => {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (window.Liferay && Liferay.authToken) {
        headers['x-csrf-token'] = Liferay.authToken;
      }

      // Fetch from API
      const response = await fetch('/o/c/rollweeks/?sort=weekStartDate:asc&pageSize=100', { headers });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const json = await response.json();
      
      // Group by weekStartDate
      const groupedData = {};
      json.items.forEach(item => {
        const dateKey = item.weekStartDate;
        if (!groupedData[dateKey]) {
          groupedData[dateKey] = {};
        }
        
        // Handle Picklist or String for facilityCode
        let facCode = item.facilityCode?.key || item.facilityCode?.name || item.facilityCode;
        if (facCode) {
          facCode = facCode.toUpperCase();
          if (facCode === 'SAUKVILLE') facCode = 'SKV';
          if (facCode === 'CLEVELAND') facCode = 'CLE';
          
          groupedData[dateKey][facCode] = item.capacityPercentage;
        }
      });

      renderChart(groupedData);

    } catch (error) {
      console.error('Error fetching roll week data:', error);
      if (chartContainer) {
        chartContainer.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: #e03131;">Error loading capacity data.</div>';
      }
    }
  };

  fetchRollWeekData();
}
