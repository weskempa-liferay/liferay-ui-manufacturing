if (fragmentElement) {
  const filterTabs = fragmentElement.querySelectorAll('.filter-tab');
  const tbody = fragmentElement.querySelector('#orders-dynamic-tbody');
  const loader = fragmentElement.querySelector('#orders-loader');

  let allOrders = [];
  let currentRollWeekFilter = null;
  let currentTypeFilter = 'all';
  let currentPage = 1;
  const pageSize = 10;

  const paginationContainer = fragmentElement.querySelector('#orders-pagination');
  const paginationInfo = fragmentElement.querySelector('#pagination-info');
  const btnPrev = fragmentElement.querySelector('#btn-prev-page');
  const btnNext = fragmentElement.querySelector('#btn-next-page');

  const getHeaders = () => {
    const headers = { 'Content-Type': 'application/json' };
    if (window.Liferay && Liferay.authToken) {
      headers['x-csrf-token'] = Liferay.authToken;
    }
    return headers;
  };

  const getStatusClass = (statusStr) => {
    const s = (statusStr || '').toLowerCase();
    if (s.includes('scheduled')) return 'status-scheduled';
    if (s.includes('production') || s.includes('processing') || s.includes('in-progress') || s.includes('tracking')) return 'status-production';
    if (s.includes('shipped') || s.includes('ready')) return 'status-shipped';
    if (s.includes('invoiced')) return 'status-invoiced';
    if (s.includes('late')) return 'status-late';
    return 'status-scheduled';
  };

  const getCustomField = (order, fieldName) => {
    if (order.customFields && order.customFields[fieldName] !== undefined) {
      return order.customFields[fieldName];
    }
    return 'N/A'; 
  };

  const getRollWeekFromDate = (isoString) => {
    if (!isoString) return null;
    const d = new Date(isoString);
    const day = d.getDay();
    const diff = d.getDate() - day; // Adjust to previous Sunday
    const sunday = new Date(d.setDate(diff));
    return sunday.toISOString().split('T')[0];
  };

  const renderTable = () => {
    if (!tbody) return;
    tbody.innerHTML = '';

    // Apply filters
    const filteredOrders = allOrders.filter(order => {
      // 1. Roll Week Filter (derived from delivery date)
      const orderRollWeek = getRollWeekFromDate(order.requestedDeliveryDate || order.createDate);
      if (currentRollWeekFilter && orderRollWeek !== currentRollWeekFilter) {
        return false;
      }

      // 2. Status Filter
      const statusDetails = getCustomField(order, 'Status Details').toLowerCase();
      if (currentTypeFilter !== 'all' && !statusDetails.includes(currentTypeFilter)) {
        return false;
      }

      return true;
    });

    if (filteredOrders.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #64748b;">No orders found matching this filter.</td></tr>';
      if (paginationContainer) paginationContainer.style.display = 'none';
      return;
    }

    // Pagination
    const totalPages = Math.ceil(filteredOrders.length / pageSize);
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, filteredOrders.length);
    const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

    if (paginationContainer) {
      paginationContainer.style.display = 'flex';
      paginationInfo.textContent = `Showing ${startIndex + 1}-${endIndex} of ${filteredOrders.length}`;
      btnPrev.disabled = currentPage === 1;
      btnNext.disabled = currentPage === totalPages;
    }

    paginatedOrders.forEach(order => {
      const tr = document.createElement('tr');
      
      const orderTypes = getCustomField(order, 'Order Type');
      const soNum = order.id || 'N/A';
      const poNum = order.purchaseOrderNumber || 'N/A';
      
      let itemsQtyFormatted = "N/A";
      if (order.summary && order.summary.itemsQuantity) {
        itemsQtyFormatted = order.summary.itemsQuantity.toLocaleString() + " lbs";
      }
      const itemDesc = `${itemsQtyFormatted}`;
      
      const grade = Array.isArray(orderTypes) ? orderTypes.join(', ') : orderTypes;
      
      const statusDetails = getCustomField(order, 'Status Details');
      const baseStatus = order.orderStatusInfo ? order.orderStatusInfo.label : 'Pending';
      const displayStatus = statusDetails !== 'N/A' ? statusDetails.split(':')[0] : baseStatus;
      const statusClass = getStatusClass(displayStatus);
      
      const rollWeek = getRollWeekFromDate(order.requestedDeliveryDate || order.createDate) || 'Unscheduled';
      
      let dueDateStr = 'N/A';
      if (order.requestedDeliveryDate) {
        const d = new Date(order.requestedDeliveryDate);
        // Correct for timezone offset so it displays the correct local day
        d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
        dueDateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }

      tr.innerHTML = `
        <td class="cell-order">#SO-${soNum}</td>
        <td>${poNum}</td>
        <td>${itemDesc}</td>
        <td>${grade}</td>
        <td><span class="status-pill ${statusClass}">${displayStatus}</span></td>
        <td>WK ${rollWeek}</td>
        <td>${dueDateStr}</td>
      `;

      tbody.appendChild(tr);
    });
  };

  const fetchOrders = async () => {
    try {
      if (loader) loader.style.display = 'flex';
      
      // Update endpoint to use the specific channel ID for placed-orders
      const endpoint = '/o/headless-commerce-delivery-order/v1.0/channels/39824/placed-orders?pageSize=50';
      const response = await fetch(endpoint, { headers: getHeaders() });
      
      if (!response.ok) {
        throw new Error('Could not fetch Liferay Commerce Orders');
      }

      const json = await response.json();
      allOrders = json.items || [];
      
      if (loader) loader.style.display = 'none';
      renderTable();

    } catch (error) {
      console.error(error);
      if (loader) loader.style.display = 'none';
      if (tbody) tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #e03131;">Failed to load Commerce Orders.</td></tr>';
    }
  };

  // Initialize
  fetchOrders();

  // Pagination Event Listeners
  if (btnPrev) {
    btnPrev.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        renderTable();
      }
    });
  }

  if (btnNext) {
    btnNext.addEventListener('click', () => {
      currentPage++;
      renderTable();
    });
  }

  // Handle Type Filter Tabs
  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      filterTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      currentTypeFilter = tab.getAttribute('data-filter');
      currentPage = 1; // Reset to page 1 on filter
      renderTable();
    });
  });

  // Listen for roll-week filter events from the roll-week fragment
  window.addEventListener('filterByRollWeek', (e) => {
    // Standardize ISO strings for comparison (e.g. 2026-05-31T00:00:00Z -> 2026-05-31)
    const targetWeek = e.detail && e.detail.week ? e.detail.week.split('T')[0] : null; 
    
    // Reset product type filter when a week is selected
    filterTabs.forEach(t => t.classList.remove('active'));
    if (filterTabs[0]) filterTabs[0].classList.add('active'); 
    currentTypeFilter = 'all';

    currentRollWeekFilter = targetWeek || null;
    currentPage = 1; // Reset to page 1 on filter
    renderTable();
  });
}
