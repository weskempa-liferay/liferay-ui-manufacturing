if (fragmentElement) {
  const form = fragmentElement.querySelector('.newsletter-form');
  const input = fragmentElement.querySelector('.newsletter-input');
  const submitBtn = fragmentElement.querySelector('.newsletter-submit-btn');
  const statusMsg = fragmentElement.querySelector('.newsletter-status-msg');

  if (form && input && submitBtn && statusMsg) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const emailVal = input.value.trim();
      if (!emailVal) return;

      // Mock subscription state feedback
      submitBtn.disabled = true;
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = 'Subscribing...';
      statusMsg.className = 'newsletter-status-msg';
      statusMsg.textContent = '';

      setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        input.value = '';

        // Add success class & message
        statusMsg.classList.add('success');
        statusMsg.textContent = 'Thank you for subscribing! Check your inbox soon.';

        // Hide success message after 4 seconds
        setTimeout(() => {
          statusMsg.style.opacity = '0';
          setTimeout(() => {
            statusMsg.textContent = '';
            statusMsg.style.opacity = '1';
            statusMsg.className = 'newsletter-status-msg';
          }, 300);
        }, 4000);

      }, 1000);
    });
  }
}
