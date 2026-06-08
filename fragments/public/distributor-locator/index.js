if (fragmentElement) {
  // Configuration defaults
  const apiEndpoint = configuration.apiEndpoint || 'https://webserver-lctresmeddemo-prd.lfr.cloud/o/c/distributors/';
  
  // DOM Elements
  const mapContainer = fragmentElement.querySelector('.distributor-map-mount');
  const listContainer = fragmentElement.querySelector('.distributor-list');
  const searchInput = fragmentElement.querySelector('.locator-search-input');
  const loadingState = fragmentElement.querySelector('.locator-loading-state');
  const emptyState = fragmentElement.querySelector('.locator-empty-state');
  
  let map = null;
  let distributors = [];
  let markers = [];
  let activeItem = null;

  // Initialize Locator
  const initLocator = () => {
    // 1. Load Leaflet JS if not already present
    if (typeof L === 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
      script.crossOrigin = '';
      script.onload = () => {
        initMap();
        fetchData();
      };
      document.head.appendChild(script);
    } else {
      initMap();
      fetchData();
    }
  };

  const initMap = () => {
    if (!mapContainer) return;
    
    // Pass the DOM element directly to Leaflet to avoid ID collisions in fragments
    map = L.map(mapContainer).setView([39.8283, -98.5795], 4); // Default to center of US

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);
  };

  const fetchData = async () => {
    try {
      const fetchOptions = {
        method: 'GET',
        headers: {}
      };
      
      // Add Liferay auth token if available
      if (typeof Liferay !== 'undefined' && Liferay.authToken) {
        fetchOptions.headers['x-csrf-token'] = Liferay.authToken;
      }

      const response = await fetch(apiEndpoint, fetchOptions);
      if (!response.ok) throw new Error('Network response was not ok');
      
      const data = await response.json();
      distributors = data.items || [];
      
      loadingState.style.display = 'none';
      renderUI(distributors);
    } catch (error) {
      console.error('Error fetching distributor data:', error);
      loadingState.innerHTML = '<p>Error loading data. Please try again later.</p>';
    }
  };

  const renderUI = (dataToRender) => {
    // Clear existing
    listContainer.innerHTML = '';
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];
    
    if (dataToRender.length === 0) {
      emptyState.style.display = 'flex';
      return;
    }
    
    emptyState.style.display = 'none';
    const bounds = L.latLngBounds();

    dataToRender.forEach((distributor, index) => {
      // Create Map Marker
      if (distributor.latitude && distributor.longitude) {
        const latLng = [distributor.latitude, distributor.longitude];
        bounds.extend(latLng);
        
        // Custom Leaflet Marker icon (optional, using default for now, can be styled via CSS classes if needed)
        const marker = L.marker(latLng).addTo(map);
        
        // Popup Content
        const popupContent = `
          <h4 class="popup-title">${distributor.storeName}</h4>
          <p class="popup-detail">${distributor.streetAddress1}</p>
          <p class="popup-detail">${distributor.city}, ${distributor.stateProvinceRegion} ${distributor.postalZipCode}</p>
          <p class="popup-detail">${distributor.phoneNumber}</p>
        `;
        marker.bindPopup(popupContent);
        markers.push({ data: distributor, marker: marker });

        // Create List Item
        const li = document.createElement('li');
        li.className = 'distributor-item';
        li.innerHTML = `
          <h3 class="dist-name">${distributor.storeName}</h3>
          <p class="dist-address">${distributor.streetAddress1}, ${distributor.city}, ${distributor.stateProvinceRegion}</p>
          <p class="dist-phone">${distributor.phoneNumber}</p>
        `;
        
        // Click Event for List Item
        li.addEventListener('click', () => {
          // Reset active class
          if (activeItem) activeItem.classList.remove('active');
          li.classList.add('active');
          activeItem = li;
          
          // Pan map and open popup
          map.flyTo(latLng, 14, { duration: 1.5 });
          marker.openPopup();
          
          // Scroll list on mobile if necessary (optional UX enhancement)
        });
        
        listContainer.appendChild(li);
        
        // Also sync map popup open to list active state
        marker.on('popupopen', () => {
           if (activeItem) activeItem.classList.remove('active');
           li.classList.add('active');
           activeItem = li;
           li.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
      }
    });

    // Fit map bounds to show all markers if there are any
    if (markers.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  };

  // Search Functionality
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const searchTerm = e.target.value.toLowerCase();
      
      const filtered = distributors.filter(dist => {
        return (
          (dist.storeName && dist.storeName.toLowerCase().includes(searchTerm)) ||
          (dist.city && dist.city.toLowerCase().includes(searchTerm)) ||
          (dist.stateProvinceRegion && dist.stateProvinceRegion.toLowerCase().includes(searchTerm)) ||
          (dist.postalZipCode && dist.postalZipCode.toLowerCase().includes(searchTerm))
        );
      });
      
      renderUI(filtered);
    });
  }

  // Start execution
  initLocator();
}
