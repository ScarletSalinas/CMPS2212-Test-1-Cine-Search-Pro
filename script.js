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

  // Handle movie selection 
  async selectMoveie(movieId) {
    console.log(`Movie selected with ID: ${movieId}`); // Log the selected movie ID for debugging

    // Show loading spinner
    this.showDetailsLoading(true);

    // Create fetch promise for movie details
    const detailsPromise = fetch(`${this.apiUrl}movie/${movieId}?api_key=${this.apiKey}`);
    const creditsPromise = fetch(`${this.apiUrl}movie/${movieId}/credits?api_key=${this.apiKey}`);
    const videosPromise = fetch(`${this.apiUrl}movie/${movieId}/videos?api_key=${this.apiKey}`);

    // Use Promise.allSettled - continues even if some fail
    const results = await Promise.allSettled([
        detailsPromise,
        creditsPromise,
        videosPromise
    ]);

    // Process each result (some may be rejected)
    let movieDetails = null;
    let credits = null;
    let videos = null;
    
    // Handle Movie Details
    if (results[0].status === 'fulfilled' && results[0].value.ok) {
        movieDetails = await results[0].value.json();
        console.log('Movie details loaded');
    } else {
        console.warn('Failed to load movie details');
    }

    // Handle Credits
    if (results[1].status === 'fulfilled' && results[1].value.ok) {
        credits = await results[1].value.json();
        console.log('✅ Credits loaded');
    } else {
        console.warn('❌ Failed to load credits');
    }
    
    // Handle Videos
    if (results[2].status === 'fulfilled' && results[2].value.ok) {
        videos = await results[2].value.json();
        console.log('✅ Videos loaded');
    } else {
        console.warn('❌ Failed to load videos');
    }
    
    // Render whatever detail we got - this is the resilience proof
    this.renderMovieDetails(movieDetails, credits, videos);
  }

  // Show loading state in details section
  showDetailsLoading() {
    // Clear existing content and show loading
    const titleSpan = document.querySelector('.meta-title');
    const yearSpan = document.querySelector('.meta-year');
    const genresSpan = document.querySelector('.meta-genres');
    const directorSpan = document.querySelector('.meta-directors');
    const castSpan = document.querySelector('.meta-cast');
    const posterImg = document.querySelector('.movie-poster');
    
    if (titleSpan) titleSpan.textContent = 'Loading...';
    if (yearSpan) yearSpan.textContent = 'Loading...';
    if (genresSpan) genresSpan.textContent = 'Loading...';
    if (directorSpan) directorSpan.textContent = 'Loading...';
    if (castSpan) castSpan.textContent = 'Loading...';
    if (posterImg) posterImg.src = '';
  }

  renderMovieDetails(details, credits, videos) {
    console.log('🎨 Rendering movie details with available data');
    
    // Update title
    const titleSpan = document.querySelector('.meta-title');
    if (titleSpan) {
        titleSpan.textContent = details?.title || 'Not available';
    }
    
    // Update year
    const yearSpan = document.querySelector('.meta-year');
    if (yearSpan && details?.release_date) {
        yearSpan.textContent = details.release_date.split('-')[0];
    } else if (yearSpan) {
        yearSpan.textContent = 'N/A';
    }

    // Update genres
    const genresSpan = document.querySelector('.meta-genres');
    if (genresSpan && details?.genres) {
        genresSpan.textContent = details.genres.map(g => g.name).join(', ');
    } else if (genresSpan) {
        genresSpan.textContent = 'Not available';
    }
    
    // Update directors (from crew)
    const directorSpan = document.querySelector('.meta-directors');
    if (directorSpan && credits?.crew) {
        const directors = credits.crew.filter(person => person.job === 'Director');
        directorSpan.textContent = directors.map(d => d.name).join(', ') || 'None listed';
    } else if (directorSpan) {
        directorSpan.textContent = 'Not available';
    }
    
    // Update cast (top 5)
    const castSpan = document.querySelector('.meta-cast');
    if (castSpan && credits?.cast) {
        const topCast = credits.cast.slice(0, 5).map(c => c.name).join(', ');
        castSpan.textContent = topCast || 'None listed';
    } else if (castSpan) {
        castSpan.textContent = 'Not available';
    }

    // Update poster
    const posterImg = document.querySelector('.movie-poster');
    if (posterImg && details?.poster_path) {
        posterImg.src = `https://image.tmdb.org/t/p/w200${details.poster_path}`;
        posterImg.alt = details.title || 'Movie poster';
    } else if (posterImg) {
        posterImg.alt = 'Poster not available';
    }
    
    console.log('✅ Movie details rendered');
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

      if (resultDiv) {
        resultDiv.setAttribute('data-movie-id', movie.id); 

        // Add click handler to each result item
        resultDiv.addEventListener('click', (event) => {
          event.preventDefault();
          this.selectMoveie(movie.id);
        });
      }

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