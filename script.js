// DOM Elements
const movieGrid = document.getElementById('movieGrid');
const searchInput = document.getElementById('searchInput');
const addMovieBtn = document.getElementById('addMovieBtn');
const movieModal = document.getElementById('movieModal');
const editModal = document.getElementById('editModal');
const closeModal = document.getElementById('closeModal');
const closeEditModal = document.getElementById('closeEditModal');
const movieForm = document.getElementById('movieForm');

// State
let movies = [];

// Initialize
function init() {
    // Load from LocalStorage or use initial data
    const storedMovies = localStorage.getItem('oml_movies');
    if (storedMovies) {
        movies = JSON.parse(storedMovies);
        // FIX: Sync posters from initialMovies to ensure paths are correct (fixes broken images from old cache)
        // AND add any missing movies that might have been lost or not loaded
        initialMovies.forEach(initial => {
            const existing = movies.find(m => m.title === initial.title);
            if (existing) {
                existing.poster = initial.poster; // Fix poster path
            } else {
                movies.push(initial); // Add missing movie
            }
        });
        saveMovies(); // Save the fixed paths back to storage
    } else {
        movies = [...initialMovies];
        saveMovies();
    }

    renderMovies(movies);
    setupEventListeners();
}

// Save to LocalStorage
function saveMovies() {
    localStorage.setItem('oml_movies', JSON.stringify(movies));
}

// Render Movies
function renderMovies(movieList) {
    movieGrid.innerHTML = '';
    movieList.forEach((movie, index) => {
        const card = document.createElement('div');
        card.className = 'movie-card';
        card.onclick = () => openMovieModal(movie);

        const poster = document.createElement('img');
        poster.src = movie.poster;
        poster.alt = movie.title;
        poster.className = 'movie-poster';
        poster.onerror = () => { poster.src = 'https://via.placeholder.com/300x450?text=No+Image'; };

        const info = document.createElement('div');
        info.className = 'movie-info';

        const title = document.createElement('h3');
        title.className = 'movie-title';
        title.textContent = movie.title;

        info.appendChild(title);
        card.appendChild(poster);
        card.appendChild(info);
        movieGrid.appendChild(card);
    });
}

// Open Movie Detail Modal
// Open Movie Detail Modal
function openMovieModal(movie) {
    document.getElementById('modalPoster').src = movie.poster;
    document.getElementById('modalTitle').textContent = movie.title;
    document.getElementById('modalActors').textContent = movie.actors || 'Non renseigné';

    // Star Rating (O, M, L)
    const ratingContainers = {
        O: document.getElementById('starRatingO'),
        M: document.getElementById('starRatingM'),
        L: document.getElementById('starRatingL')
    };

    // Helper to get rating value safely
    const getRating = (person) => {
        if (movie.rating && typeof movie.rating === 'object') {
            return parseInt(movie.rating[person]) || 0;
        }
        return 0; // Default if old format or missing
    };

    function updateStars(person, value) {
        const container = ratingContainers[person];
        const stars = container.querySelectorAll('.star');
        stars.forEach(s => {
            const starVal = parseInt(s.dataset.value);
            if (starVal <= value) {
                s.classList.remove('far');
                s.classList.add('fas', 'filled');
            } else {
                s.classList.remove('fas', 'filled');
                s.classList.add('far');
            }
        });
    }

    ['O', 'M', 'L'].forEach(person => {
        const currentVal = getRating(person);
        updateStars(person, currentVal);

        // Click to rate
        const stars = ratingContainers[person].querySelectorAll('.star');
        stars.forEach(star => {
            star.onclick = (e) => {
                e.stopPropagation();
                const value = parseInt(e.target.dataset.value);

                // Ensure rating object exists
                if (typeof movie.rating !== 'object') {
                    movie.rating = { O: 0, M: 0, L: 0 };
                }

                movie.rating[person] = value;
                saveMovies();
                updateStars(person, value);
            };
        });
    });

    // Music
    const musicDiv = document.getElementById('modalMusic');
    musicDiv.innerHTML = '';
    if (movie.music) {
        const audio = document.createElement('audio');
        audio.controls = true;
        audio.src = movie.music;
        audio.style.width = '100%';
        audio.style.marginTop = '1rem';
        musicDiv.appendChild(audio);
    } else {
        musicDiv.textContent = 'Aucune musique disponible.';
    }

    // Tabs
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    function activateTab(tabId) {
        tabBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });
        tabContents.forEach(content => {
            content.classList.toggle('active', content.id === `tab-${tabId}`);
        });
    }

    tabBtns.forEach(btn => {
        btn.onclick = () => activateTab(btn.dataset.tab);
    });

    // Reset to first tab
    activateTab('details');

    // Quotes
    const quotesDiv = document.getElementById('modalQuotes');
    quotesDiv.innerHTML = '';
    if (movie.quotes && movie.quotes.length > 0) {
        movie.quotes.forEach(quote => {
            const p = document.createElement('p');
            p.textContent = quote.startsWith('#') ? quote : '#' + quote;
            quotesDiv.appendChild(p);
        });
    } else {
        quotesDiv.textContent = 'Aucune réplique ajoutée.';
    }

    document.getElementById('modalPlatforms').textContent = movie.platforms || 'Streaming essentiellement';
    document.getElementById('modalComments').textContent = movie.comments || 'Aucun commentaire.';

    // Trailer
    const trailerContainer = document.getElementById('trailerContainer');
    trailerContainer.innerHTML = '';
    if (movie.trailer) {
        let embedUrl = movie.trailer;
        if (embedUrl.includes('watch?v=')) {
            embedUrl = embedUrl.replace('watch?v=', 'embed/');
        } else if (embedUrl.includes('youtu.be/')) {
            embedUrl = embedUrl.replace('youtu.be/', 'youtube.com/embed/');
        }

        const iframe = document.createElement('iframe');
        iframe.src = embedUrl;
        iframe.frameBorder = '0';
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        iframe.allowFullscreen = true;
        trailerContainer.appendChild(iframe);
    } else {
        // Smart Search Link
        const searchUrl = `https://www.youtube.com/results?search_query=Bande+annonce+VF+${encodeURIComponent(movie.title)}`;
        trailerContainer.innerHTML = `
            <div style="text-align: center; padding: 2rem; background: #222; border-radius: 8px;">
                <p style="margin-bottom: 1rem; color: #ccc;">Bande annonce non intégrée.</p>
                <a href="${searchUrl}" target="_blank" class="enter-btn" style="font-size: 1rem; padding: 0.8rem 1.5rem;">
                    <i class="fab fa-youtube"></i> Rechercher sur YouTube
                </a>
            </div>
        `;
    }

    // Setup Edit Button
    const editBtn = document.getElementById('editMovieBtn');
    editBtn.onclick = (e) => {
        e.stopPropagation();
        openEditModal(movie);
    };

    movieModal.classList.add('active');
}

// Open Edit/Add Modal
function openEditModal(movie = null) {
    movieModal.classList.remove('active'); // Close detail modal if open
    editModal.classList.add('active');

    const isEdit = !!movie;
    document.getElementById('editModalTitle').textContent = isEdit ? 'Modifier le film' : 'Ajouter un film';
    document.getElementById('editMovieId').value = isEdit ? movie.title : ''; // Use title as ID for simplicity

    document.getElementById('editTitle').value = isEdit ? movie.title : '';
    document.getElementById('editPosterUrl').value = isEdit ? movie.poster : '';
    document.getElementById('editTrailer').value = isEdit ? movie.trailer : '';

    // Music
    document.getElementById('editMusicData').value = isEdit ? (movie.music || '') : '';
    document.getElementById('editMusicStatus').textContent = isEdit && movie.music ? 'Musique chargée.' : 'Aucune musique.';
    document.getElementById('editMusicFile').value = ''; // Reset file input

    document.getElementById('editActors').value = isEdit ? movie.actors : '';

    // Rating
    const getRating = (person) => {
        if (isEdit && movie.rating && typeof movie.rating === 'object') {
            return movie.rating[person] || 0;
        }
        return 0;
    };

    document.getElementById('editRatingO').value = getRating('O');
    document.getElementById('editRatingM').value = getRating('M');
    document.getElementById('editRatingL').value = getRating('L');

    document.getElementById('editQuotes').value = isEdit ? (movie.quotes || []).join('\n') : '';
    document.getElementById('editPlatforms').value = isEdit ? movie.platforms : '';
    document.getElementById('editComments').value = isEdit ? movie.comments : '';

    // Handle music upload
    const musicInput = document.getElementById('editMusicFile');
    musicInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                document.getElementById('editMusicData').value = event.target.result;
                document.getElementById('editMusicStatus').textContent = 'Nouvelle musique prête à être sauvegardée.';
            };
            reader.readAsDataURL(file);
        }
    };

    // Handle file upload simulation
    const fileInput = document.getElementById('editPosterFile');
    fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // In a real app we would upload. Here we just use a fake local path or object URL
            // Since we can't save files to disk from browser, we'll use FileReader to show it works in session
            const reader = new FileReader();
            reader.onload = (event) => {
                document.getElementById('editPosterUrl').value = event.target.result; // Base64 for local storage
            };
            reader.readAsDataURL(file);
        }
    };
}

// Event Listeners
function setupEventListeners() {
    // Search
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = movies.filter(m => m.title.toLowerCase().includes(term));
        renderMovies(filtered);
    });

    // Modals
    closeModal.onclick = () => movieModal.classList.remove('active');
    closeEditModal.onclick = () => editModal.classList.remove('active');

    window.onclick = (e) => {
        if (e.target === movieModal) movieModal.classList.remove('active');
        if (e.target === editModal) editModal.classList.remove('active');
    };

    // Add Button
    addMovieBtn.onclick = () => openEditModal(null);

    // Form Submit
    movieForm.onsubmit = (e) => {
        e.preventDefault();

        const id = document.getElementById('editMovieId').value;
        const title = document.getElementById('editTitle').value;
        const poster = document.getElementById('editPosterUrl').value;
        const trailer = document.getElementById('editTrailer').value;
        const music = document.getElementById('editMusicData').value;
        const actors = document.getElementById('editActors').value;
        const ratingO = parseInt(document.getElementById('editRatingO').value) || 0;
        const ratingM = parseInt(document.getElementById('editRatingM').value) || 0;
        const ratingL = parseInt(document.getElementById('editRatingL').value) || 0;
        const quotes = document.getElementById('editQuotes').value.split('\n').filter(q => q.trim() !== '');
        const platforms = document.getElementById('editPlatforms').value;
        const comments = document.getElementById('editComments').value;

        const newMovie = {
            title,
            poster,
            trailer,
            music,
            actors,
            rating: { O: ratingO, M: ratingM, L: ratingL },
            quotes,
            platforms,
            comments
        };

        if (id) {
            // Edit existing
            const index = movies.findIndex(m => m.title === id);
            if (index !== -1) {
                movies[index] = newMovie;
            }
        } else {
            // Add new (to top)
            movies.unshift(newMovie);
        }

        saveMovies();
        renderMovies(movies);
        editModal.classList.remove('active');
    };
}

// Run
init();
