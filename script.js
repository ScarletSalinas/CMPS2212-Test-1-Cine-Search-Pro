/*<!---Scarlet Salinas | 2022156127--->
  <!---CMPS2212 GUI Programming--->
  <!---Test #1: Cine-Search Pro--->
  <!---Date: 2023-10-01--->
  <!---File: script.js--->
*/

class SearchComponent {
  constructor() {
      console.log('Constructor starting...');
      
      // DOM elements
      this.searchInput = document.querySelector('.search-bar');
      this.resultsContainer = document.querySelector('.results-container');
      
      // Log to debug
      console.log('Search input found:', this.searchInput);
      console.log('Results container found:', this.resultsContainer);
      
      // State
      this.cache = new Map(); // Cache for search results
      this.debounceTimer = null;
      this.currentAbortController = null; // For cancelling in-flight requests    
      
      // API config
      this.apiKey = 'b6b1681d98a28ca6f7744913adc19360';
      this.apiUrl = 'https://api.themoviedb.org/3/';
      
      // Bind methods
      this.handleSearch = this.handleSearch.bind(this);
      
      // Initialize
      this.init();
  }
    
  init() {
      // Loading attribute for css spinner
      document.body.setAttribute('data-loading', 'false');
      
      // Check if elements exist before adding listener
      if (this.searchInput) {
          this.searchInput.addEventListener('input', this.handleSearch);
          console.log('Event listener added to search input');
      } else {
          console.error('Search input not found! Check HTML class name.');
      }
      
      console.log('SearchComponent initialized');
  }
    
  // Handle search input
  handleSearch(event) {
    const query = event.target.value.trim();

    console.log('Search input changed:', query); // Log the current query for debugging
    
    if (query.length === 0) {
        this.clearResults();
        return;
    }
    
    // Apply debounce of 300ms to search function
    this.debounce(() => this.performSearch(query), 300)();
  }

  // Debounce implementation
  debounce(func, delay) {
      return (...args) => {
          clearTimeout(this.debounceTimer); // Clear previous timer
          this.debounceTimer = setTimeout(() => func.apply(this, args), delay);
      };
  }
    
  async performSearch(query) {
    // Check cache first
    if (this.cache.has(query)) {
      console.log(`Cache hit! Loading results for query: ${query} from cache.`);
      const cachedResults = this.cache.get(query);
      this.renderResults(cachedResults);
      return;
    }

    // Cancel previous request if still in-flight
    if (this.currentAbortController) {
      console.log('Aborting previous search request');
      this.currentAbortController.abort();
    }

    // Create new AbortController for current request
    this.currentAbortController = new AbortController();  
    const signal = this.currentAbortController.signal;

    console.log(`Cache miss. Fetching results for query: ${query} from API.`);
    
    // Show loading spinner
    document.body.setAttribute('data-loading', 'true');
    
    try {
      const response = await fetch(
        `${this.apiUrl}search/movie?api_key=${this.apiKey}&query=${encodeURIComponent(query)}`,
        { signal } // Pass the abort signal to fetch for cancellation support
      );
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }
        
      const data = await response.json();
      const results = data.results || [];

      // Store results in cache
      this.cache.set(query, results);
      console.log(`Results for query: ${query} cached successfully. Cache size: ${this.cache.size}`);
     
      // Render results
      this.renderResults(results);
          
    } catch (error) {
      // Handle fetch errors gracefully

      // abort errors are expected when cancelling previous requests, 
      // so log them but don't show an error message to the user
      if (error.name === 'AbortError') {
        console.log('Search was cancelled');
        return;
      }
      
      console.error('Error during search:', error);

      if (this.resultsContainer) {
        this.resultsContainer.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
      }
    } finally {
      // Hide loading spinner
      document.body.setAttribute('data-loading', 'false');
      
      // Clear currentAbortController if it is current one
      if (this.currentAbortController && this.currentAbortController.signal === signal) {
        this.currentAbortController = null;
      }
    }
  }

  // Render search results
  renderResults(movies) {
    if (!movies.length) {
      this.resultsContainer.innerHTML = '<p>No movies found.</p>';
      return;
    }

    // Get template
    const template = document.getElementById('movie-result-template');

    if (!template) {
      console.error('Movie result template not found! Check HTML id.');
      this.resultsContainer.innerHTML = `<p>Found ${movies.length} movies</p>`;
      return;
    }

    // Create DocumentFragment
    const fragment = document.createDocumentFragment();

    // Build all results in memory
    movies.forEach(movie => {
      const clone = template.content.cloneNode(true);

      // Set text content - no innerHTML to avoid XSS
      const titleElement = clone.querySelector('.result-title');
      const yearElement = clone.querySelector('.result-year');
      const resultDiv = clone.querySelector('.result-item');

      if (titleElement) titleElement.textContent = movie.title || 'No Title';
      if (yearElement) yearElement.textContent = movie.release_date ? movie.release_date.split('-')[0] : 'N/A';
      if (resultDiv) resultDiv.setAttribute('data-movie-id', movie.id); // Store movie ID for later use

      // Append to fragment
      fragment.appendChild(clone);  
    });

    // Clear ansd append all at once
    this.resultsContainer.innerHTML = '';
    this.resultsContainer.appendChild(fragment);

    console.log(`Rendered ${movies.length} results using Fragment pattern`);
    
  }


  // Clear previous results
  clearResults() {
    if (this.resultsContainer) {
      this.resultsContainer.innerHTML = '';
      console.log('Results cleared');
    }
  }
}

// Wait for DOM to be fully loaded before initializing
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM fully loaded, starting app...');
  new SearchComponent();
});