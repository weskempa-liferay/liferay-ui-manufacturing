if (fragmentElement) {
  const submitBtn = fragmentElement.querySelector('#mips-submit-btn');
  const msgContainer = fragmentElement.querySelector('#mips-msg');
  const releaseInputs = fragmentElement.querySelectorAll('.mips-release-input');
  const forecastInputs = fragmentElement.querySelectorAll('.mips-forecast-input');

  const showMessage = (text, type) => {
    msgContainer.textContent = text;
    msgContainer.className = `mips-validation-message mips-msg-${type}`;
    msgContainer.style.display = 'block';
    setTimeout(() => {
      msgContainer.style.display = 'none';
    }, 5000);
  };

  if (submitBtn) {
    submitBtn.addEventListener('click', (e) => {
      e.preventDefault();
      let isValid = true;

      // Basic validation: ensure all release inputs are non-negative numbers
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

      // Simulate an API call using the Liferay best practice for CSRF
      const mockPayload = {
        forecast: Array.from(forecastInputs).map(inp => ({ week: inp.dataset.week, qty: inp.value })),
        release: Array.from(releaseInputs).map(inp => ({ week: inp.dataset.week, qty: inp.value }))
      };

      // Mock fetch call
      setTimeout(() => {
        console.log('Submitted payload:', mockPayload);
        console.log('CSRF Token would be:', window.Liferay ? window.Liferay.authToken : 'N/A');
        
        showMessage('Forecast & Release submitted successfully for Charter Wire.', 'success');
        submitBtn.textContent = 'Submit Forecast & Release';
        submitBtn.disabled = false;
      }, 800);
    });
  }

  // Handle Save Draft
  const draftBtn = fragmentElement.querySelector('#mips-save-draft');
  if (draftBtn) {
    draftBtn.addEventListener('click', (e) => {
      e.preventDefault();
      showMessage('Draft saved locally.', 'success');
    });
  }
}
