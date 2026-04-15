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
        this.cache = new Map();
        this.debounceTimer = null;
        
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
    
    // Debounce implementation
    debounce(func, delay) {
        return (...args) => {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(() => func.apply(this, args), delay);
        };
    }
    
    // Handle search input
    handleSearch(event) {
        const query = event.target.value.trim();
        console.log('Search input changed:', query);
        
        if (query.length === 0) {
            this.clearResults();
            return;
        }
        
        // Apply debounce of 300ms to search function
        this.debounce(() => this.performSearch(query), 300)();
    }
    
    async performSearch(query) {
        console.log(`Performing search for: ${query}`);
        
        // Show loading spinner
        document.body.setAttribute('data-loading', 'true');
        
        try {
            const response = await fetch(
                `${this.apiUrl}search/movie?api_key=${this.apiKey}&query=${encodeURIComponent(query)}`
            );
            
            if (!response.ok) {
                throw new Error(`Search failed: ${response.statusText}`);
            }
            
            const data = await response.json();
            const results = data.results || [];
            
            console.log(`Found ${results.length} results for query: ${query}`);
            console.log('First result:', results[0]); // Log first movie to see data
            
            // Display results in container (temporary - will replace with proper rendering)
            if (this.resultsContainer) {
                this.resultsContainer.innerHTML = `<p>Found ${results.length} movies!</p>`;
            }
            
        } catch (error) {
            console.error('Error during search:', error);
            if (this.resultsContainer) {
                this.resultsContainer.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
            }
        } finally {
            // Hide loading spinner
            document.body.setAttribute('data-loading', 'false');
        }
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