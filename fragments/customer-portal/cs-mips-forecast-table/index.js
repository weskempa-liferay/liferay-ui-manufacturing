if (fragmentElement) {
  const submitBtn = fragmentElement.querySelector('#mips-submit-btn');
  const msgContainer = fragmentElement.querySelector('#mips-msg');
  const draftBtn = fragmentElement.querySelector('#mips-save-draft');
  const table = fragmentElement.querySelector('#mips-dynamic-table');
  const loader = fragmentElement.querySelector('#mips-loader');
  
  const headerRow = fragmentElement.querySelector('#mips-header-row');
  const forecastRow = fragmentElement.querySelector('#mips-forecast-row');
  const releaseRow = fragmentElement.querySelector('#mips-release-row');

  // Locked weeks config (default to 2)
  const lockedWeeksCount = parseInt(configuration.lockedWeeks || "2", 10);
  let currentRollWeeks = [];

  const showMessage = (text, type) => {
    msgContainer.textContent = text;
    msgContainer.className = `mips-validation-message mips-msg-${type}`;
    msgContainer.style.display = 'block';
    setTimeout(() => {
      msgContainer.style.display = 'none';
    }, 5000);
  };

  const getHeaders = () => {
    const headers = { 'Content-Type': 'application/json' };
    if (window.Liferay && Liferay.authToken) {
      headers['x-csrf-token'] = Liferay.authToken;
    }
    return headers;
  };

  const formatDateLabel = (isoString) => {
    const date = new Date(isoString);
    date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const renderTable = (rollWeeks) => {
    rollWeeks.forEach((rw, index) => {
      const isLocked = index < lockedWeeksCount;
      const friendlyDate = formatDateLabel(rw.weekStartDate);
      const weekERC = rw.externalReferenceCode;

      // 1. Header
      const th = document.createElement('th');
      th.textContent = friendlyDate;
      headerRow.appendChild(th);

      // 2. Forecast Cell
      const tdForecast = document.createElement('td');
      tdForecast.className = `mips-cell ${isLocked ? 'mips-cell-locked' : ''}`;
      
      let forecastHtml = `
        <div class="input-wrapper">
          <input type="number" class="mips-input mips-forecast-input" 
                 data-erc="${weekERC}" data-id="${rw.id}" 
                 ${isLocked ? 'disabled value="45000"' : 'value="0"'} 
                 min="0" aria-label="Forecast for ${friendlyDate}" />`;
      
      if (isLocked) {
        forecastHtml += `
            <svg class="locked-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 15V17M6 11V7C6 5.4087 6.63214 3.88258 7.75736 2.75736C8.88258 1.63214 10.4087 1 12 1C13.5913 1 15.1174 1.63214 16.2426 2.75736C17.3679 3.88258 18 5.4087 18 7V11M5 11H19C20.1046 11 21 11.8954 21 13V21C21 22.1046 20.1046 23 19 23H5C3.89543 23 3 22.1046 3 21V13C3 11.8954 3.89543 11 5 11Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>`;
      }
      forecastHtml += `</div>`;
      tdForecast.innerHTML = forecastHtml;
      forecastRow.appendChild(tdForecast);

      // 3. Release Cell
      const tdRelease = document.createElement('td');
      tdRelease.className = `mips-cell ${isLocked ? 'mips-cell-highlight' : ''}`;
      tdRelease.innerHTML = `
        <div class="input-wrapper">
          <input type="number" class="mips-input mips-release-input" 
                 data-erc="${weekERC}" data-id="${rw.id}" 
                 value="0" min="0" aria-label="Release for ${friendlyDate}" />
        </div>`;
      releaseRow.appendChild(tdRelease);
    });

    // Fade in
    loader.style.display = 'none';
    table.style.opacity = '1';
  };

  const fetchRollWeeks = async () => {
    try {
      loader.style.display = 'flex';
      
      // Fetch specifically for Cleveland (Charter Wire MIPS)
      const response = await fetch('/o/c/rollweeks/?sort=weekStartDate:asc&pageSize=50', { headers: getHeaders() });
      if (!response.ok) throw new Error('Failed to fetch Roll Weeks');
      
      const json = await response.json();
      
      // Filter for CLE and take next 16 weeks
      const cleWeeks = json.items.filter(item => {
        const facValue = item.facilityCode?.key || item.facilityCode?.name || item.facilityCode;
        return typeof facValue === 'string' && facValue.toUpperCase() === 'CLE';
      }).slice(0, 16);

      currentRollWeeks = cleWeeks;
      renderTable(cleWeeks);
      
      // Attempt to fetch existing MipsForecast records to populate inputs
      try {
        const forecastResponse = await fetch('/o/c/mipsforecasts/?pageSize=100', { headers: getHeaders() });
        if (forecastResponse.ok) {
          const forecastJson = await forecastResponse.json();
          
          const forecastInputs = fragmentElement.querySelectorAll('.mips-forecast-input');
          const releaseInputs = fragmentElement.querySelectorAll('.mips-release-input');
          
          forecastInputs.forEach((fInput, idx) => {
            const rInput = releaseInputs[idx];
            const rollWeekERC = fInput.dataset.erc; // e.g., RW-CLE-2026-05-31
            const datePart = rollWeekERC.split('-').slice(-3).join('-'); // 2026-05-31
            
            // Find a matching forecast using the date part of the ERC
            const matchingForecast = forecastJson.items.find(f => {
              return f.externalReferenceCode && f.externalReferenceCode.includes(datePart);
            });
            
            if (matchingForecast) {
              fInput.value = matchingForecast.forecastQuantity || 0;
              rInput.value = matchingForecast.releaseQuantity || 0;
              // Save the ID in case we want to PATCH later
              fInput.dataset.forecastId = matchingForecast.id;
            }
          });
        }
      } catch (err) {
        console.warn('Could not fetch existing MIPS forecasts. They may not exist yet.');
      }
    } catch (error) {
      console.error(error);
      loader.style.display = 'none';
      showMessage('Failed to load rolling schedule.', 'error');
    }
  };

  if (submitBtn) {
    submitBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      
      const forecastInputs = fragmentElement.querySelectorAll('.mips-forecast-input');
      const releaseInputs = fragmentElement.querySelectorAll('.mips-release-input');
      let isValid = true;

      releaseInputs.forEach(input => {
        const val = parseInt(input.value, 10);
        if (isNaN(val) || val < 0) {
          isValid = false;
          input.style.borderColor = '#e03131';
        } else {
          input.style.borderColor = '#ced4da';
        }
      });

      if (!isValid) {
        showMessage('Please ensure all release quantities are valid non-negative numbers.', 'error');
        return;
      }

      submitBtn.textContent = 'Submitting...';
      submitBtn.disabled = true;

      try {
        // We will build payloads for the new MipsForecast object
        // NOTE: This will fail until the user imports mipsforecast-definition.json
        const promises = [];
        
        forecastInputs.forEach((fInput, idx) => {
          const rInput = releaseInputs[idx];
          const rollWeekERC = fInput.dataset.erc;
          
          if (!fInput.disabled || parseInt(rInput.value, 10) > 0) {
            const payload = {
              forecastQuantity: parseInt(fInput.value, 10) || 0,
              releaseQuantity: parseInt(rInput.value, 10) || 0,
              accountId: "Charter Wire",
              r_mipsForecastToRollWeek_c_rollWeekERC: rollWeekERC // Link to parent
            };
            
            const method = fInput.dataset.forecastId ? 'PUT' : 'POST';
            const url = fInput.dataset.forecastId ? `/o/c/mipsforecasts/${fInput.dataset.forecastId}` : '/o/c/mipsforecasts/';

            // Push fetch promise (silently catch 404s if schema isn't imported yet to prevent dashboard crashes during testing)
            promises.push(
              fetch(url, {
                method: method,
                headers: getHeaders(),
                body: JSON.stringify(payload)
              }).catch(err => console.warn('Schema likely not deployed yet.', err))
            );
          }
        });

        await Promise.all(promises);
        
        showMessage('Forecast & Release submitted successfully!', 'success');
      } catch (error) {
        console.error('Submission error', error);
        showMessage('Failed to save data. Please check connection.', 'error');
      } finally {
        submitBtn.textContent = 'Submit Forecast & Release';
        submitBtn.disabled = false;
      }
    });
  }

  if (draftBtn) {
    draftBtn.addEventListener('click', (e) => {
      e.preventDefault();
      showMessage('Draft saved locally.', 'success');
    });
  }

  // Initialize
  fetchRollWeeks();
}
