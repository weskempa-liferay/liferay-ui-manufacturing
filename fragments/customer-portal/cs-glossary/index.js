if (fragmentElement) {
  const searchInput = fragmentElement.querySelector('#glossary-search');
  const searchClear = fragmentElement.querySelector('#glossary-search-clear');
  const alphabetFilter = fragmentElement.querySelector('#glossary-alphabet-filter');
  const resultsContainer = fragmentElement.querySelector('#glossary-results');
  const loader = fragmentElement.querySelector('#glossary-loader');
  const noResults = fragmentElement.querySelector('#glossary-no-results');

  let allTerms = [];
  let currentLetter = null;

  // Liferay API setup
  const endpoint = '/o/c/glossaryterms/';
  const getHeaders = () => {
    const headers = { 'Content-Type': 'application/json' };
    if (window.Liferay && Liferay.authToken) {
      headers['x-csrf-token'] = Liferay.authToken;
    }
    return headers;
  };

  const fetchTerms = async () => {
    try {
      const url = window.Liferay && Liferay.ThemeDisplay 
        ? `${Liferay.ThemeDisplay.getPortalURL()}${endpoint}?pageSize=100` 
        : endpoint + '?pageSize=100';
        
      const response = await fetch(url, { headers: getHeaders() });
      if (!response.ok) throw new Error('Failed to fetch terms');
      
      const data = await response.json();
      
      // Sort terms alphabetically by default
      allTerms = (data.items || []).sort((a, b) => a.term.localeCompare(b.term));
      
      buildAlphabet(allTerms);
      renderTerms(allTerms);
    } catch (error) {
      console.error('Error fetching glossary:', error);
      loader.style.display = 'none';
      noResults.style.display = 'flex';
      noResults.querySelector('p').textContent = 'Unable to load glossary terms. Please try again later.';
    }
  };

  const renderTerms = (termsToRender) => {
    loader.style.display = 'none';
    resultsContainer.innerHTML = '';

    if (termsToRender.length === 0) {
      resultsContainer.style.display = 'none';
      noResults.style.display = 'flex';
      return;
    }

    resultsContainer.style.display = 'flex';
    noResults.style.display = 'none';

    termsToRender.forEach(item => {
      const card = document.createElement('div');
      card.className = 'glossary-term-card';
      
      const header = document.createElement('div');
      header.className = 'glossary-term-header';
      
      const title = document.createElement('h3');
      title.className = 'glossary-term-name';
      title.textContent = item.term || 'Unknown Term';
      
      const cat = document.createElement('span');
      cat.className = 'glossary-term-cat';
      cat.textContent = item.category ? (item.category.name || item.category.key || 'General') : 'General';
      
      header.appendChild(title);
      if (item.category) header.appendChild(cat);
      
      const def = document.createElement('p');
      def.className = 'glossary-term-def';
      def.textContent = item.definition || '';
      
      card.appendChild(header);
      card.appendChild(def);
      resultsContainer.appendChild(card);
    });
  };

  const buildAlphabet = (terms) => {
    alphabetFilter.innerHTML = '';
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    
    // Find which letters actually have terms
    const activeLetters = new Set(terms.map(t => (t.term || '').charAt(0).toUpperCase()));

    // "All" button
    const btnAll = document.createElement('button');
    btnAll.className = `glossary-alpha-btn ${currentLetter === null ? 'active' : ''}`;
    btnAll.textContent = 'All';
    btnAll.addEventListener('click', () => {
      currentLetter = null;
      applyFilters();
    });
    alphabetFilter.appendChild(btnAll);

    letters.forEach(letter => {
      const btn = document.createElement('button');
      btn.className = 'glossary-alpha-btn';
      btn.textContent = letter;
      
      if (!activeLetters.has(letter)) {
        btn.disabled = true;
      } else {
        if (currentLetter === letter) btn.classList.add('active');
        btn.addEventListener('click', () => {
          currentLetter = currentLetter === letter ? null : letter; // toggle
          applyFilters();
        });
      }
      
      alphabetFilter.appendChild(btn);
    });
  };

  const applyFilters = () => {
    const query = (searchInput.value || '').toLowerCase().trim();
    
    // Update clear button visibility
    searchClear.style.display = query.length > 0 ? 'flex' : 'none';

    // Update active state of alphabet buttons
    const btns = alphabetFilter.querySelectorAll('.glossary-alpha-btn');
    btns.forEach(btn => {
      if (btn.textContent === 'All') {
        btn.classList.toggle('active', currentLetter === null);
      } else {
        btn.classList.toggle('active', currentLetter === btn.textContent);
      }
    });

    const filtered = allTerms.filter(item => {
      const t = (item.term || '').toLowerCase();
      const d = (item.definition || '').toLowerCase();
      
      // 1. Text Search
      const matchesSearch = query === '' || t.includes(query) || d.includes(query);
      
      // 2. Letter Filter
      const matchesLetter = currentLetter === null || t.toUpperCase().startsWith(currentLetter);

      return matchesSearch && matchesLetter;
    });

    renderTerms(filtered);
  };

  // Event Listeners
  if (searchInput) {
    searchInput.addEventListener('input', applyFilters);
  }

  if (searchClear) {
    searchClear.addEventListener('click', () => {
      searchInput.value = '';
      applyFilters();
      searchInput.focus();
    });
  }

  // Init
  fetchTerms();
}
