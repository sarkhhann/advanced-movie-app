// API Configuration

const API_BASE = 'https://movie-app-api.gulmammadlisarkhan.workers.dev/'


const IMG_BASE = 'https://image.tmdb.org/t/p/'

// Application State

let page = 1
let currentSearch = ''
let isFirstLoad = false
let totalPage = 1
let lastSuccessfulPage = 1
let currentGenre = 'all'
let currentYear = ''
let currentSort = ''
let currentView = 'home'
let requestId = 0

const toDay = new Date()
const stringDate = toDay.toISOString().slice(0, 10)
console.log(stringDate)

const genreIds = {
    action: 28,
    drama: 18,
    comedy: 35,
    animation: 16
}

const modalCloseBtn = document.querySelector('.modal-close')
const modalOverlay = document.querySelector('.modal-overlay')
const trendingMovies = document.querySelector('.trending-movies')
const nextBtn = document.querySelector('.next-btn')
const prevBtn = document.querySelector('.prev-btn')

const prevPageId = document.getElementById('prev-pageId')
const nextPageId = document.getElementById('next-pageId')
const pageNumbers = document.querySelector('.page-numbers')

const searchInput = document.querySelector('.search-input')
const searchBtn = document.querySelector('.search-btn')
const searchBox = document.querySelector('.search-box')

const genreBtns = document.querySelectorAll('.genre-btn')
const yearSelect = document.querySelector('.year-select')
const sortSelect = document.querySelector('.sort-select')
const themeToggleBtn = document.querySelector('.theme-toggle')
const statusMessage = document.querySelector('.status-message')
const homeNavLink = document.querySelectorAll('.main-nav a')[0];
const trendNavLink = document.querySelectorAll('.main-nav a')[1];

const savedTheme = localStorage.getItem('theme')
if(savedTheme === 'light') {
    document.body.classList.add('light-mode')
    if(themeToggleBtn){
        themeToggleBtn.textContent = '🌙'
    }
}

const getMovies = async () => {

    requestId++

    const myRequestId = requestId

    try {
        nextPageId.disabled = true
        prevPageId.disabled = true

        if(statusMessage){
            statusMessage.textContent = 'Loading...'
            statusMessage.classList.remove('hidden')
        }

        const numericGenreId = genreIds[currentGenre]
        console.log(numericGenreId, 'selected genre')

        let genreParam = ''
        let yearParam = ''
        let sortParam = ''
        let voteCountParam = ''
        let dateParam = ''

        if(currentGenre !== 'all') {
            genreParam = `&with_genres=${numericGenreId}`
        }

        if(currentYear === '2010s') {
            yearParam = '&primary_release_date.gte=2010-01-01&primary_release_date.lte=2019-12-31'
        }else if(currentYear === 'older') {
            yearParam = '&primary_release_date.lte=2009-12-31'
        }else if(currentYear !== '') {
            yearParam = `&primary_release_year=${currentYear}`
        }

        if(currentSort !== '') {
            sortParam = `&sort_by=${currentSort}`
        }

        if(currentSort === 'vote_average.desc') {
            voteCountParam = '&vote_count.gte=1000'
        }

        if(currentSort === 'primary_release_date.desc') {
            dateParam = `&primary_release_date.lte=${stringDate}`
        }

        const response = await fetch(`${API_BASE}discover/movie?page=${page}${genreParam}${yearParam}${sortParam}${voteCountParam}${dateParam}`)

        if(!response.ok) {
            throw new Error('Failed to fetch movies')
        }

        const data = await response.json()

        // Ignore outdated API responses to prevent race conditions.

        if(requestId !== myRequestId) {
            return
        }

        if(currentView !== 'home') {
            return
        }

        totalPage = data.total_pages

        if(data.results && data.results.length > 0) {
            if(!isFirstLoad) {
                showHero(data.results[0])
                showTrending(data.results.slice(1, 12));
                isFirstLoad = true
            }

            showMovies(data.results);
            lastSuccessfulPage = page
            pageNumbers.textContent = `Page: ${page}`

            if(statusMessage){
                statusMessage.textContent = ''
                statusMessage.classList.add('hidden')
            }
        } else {
            const allMovieGrid = document.querySelector('.movie-grid')
            allMovieGrid.innerHTML = ''

            if(statusMessage){
                statusMessage.textContent = 'No movies found.'
                statusMessage.classList.remove('hidden')
            }
        }

        console.log(data)

    }catch (e) {
        console.log('An error occurred', e.message)

        if(requestId === myRequestId) {

            page = lastSuccessfulPage

            if(statusMessage){
                statusMessage.textContent = 'An error occurred while loading movies.'
                statusMessage.classList.remove('hidden')
            }
        }

    }finally {

        if(requestId === myRequestId) {
            prevPageId.disabled = (page === 1)
            nextPageId.disabled = (page === totalPage || totalPage === 0)
        }
    }
}

const showHero = (movie) => {
    const imgHero = document.getElementById('img-hero')
    const heroTitle = document.querySelector('.hero-title')
    const heroRatingYear = document.querySelector('.hero-rating-year')
    const movieAbout = document.querySelector('.movie-about')

    imgHero.src = movie.backdrop_path ? `${IMG_BASE}w1280${movie.backdrop_path}` : 'noimage.jpg'
    imgHero.alt = movie.title
    heroTitle.textContent = movie.title

    const releaseYear = movie.release_date ? movie.release_date.slice(0, 4) : 'N/A'
    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : '0.0'

    heroRatingYear.innerHTML = `Rating: ${rating} <br> Release year: ${releaseYear}`
    movieAbout.textContent = movie.overview || 'No overview available.'

    const lookDetailsBtn = document.querySelector('.look-details')
    lookDetailsBtn.onclick = () => {
        showMovieDetails(movie)
    }
}

const createMovieCard = (movie) => {
    const card = document.createElement('div')
    card.classList.add('movie-card')

    const posterUrl = movie.poster_path ? `${IMG_BASE}w1280${movie.poster_path}` : 'noimage.jpg'
    const releaseYear = movie.release_date ? movie.release_date.slice(0, 4) : ''

    card.innerHTML = `
        <img src="" alt="">
        <div class="movie-card-info">
            <h3 class="movie-card-title"></h3>
            <div class="movie-card-meta">
                <span class="movie-card-rating">⭐ ${movie.vote_average.toFixed(1)}</span>
                <span class="card-release-year"></span>
            </div>
        </div>`

    const titleElementH3 = card.querySelector('.movie-card-title')
    const imgElement = card.querySelector('img')
    const spanIdElement = card.querySelector('.card-release-year')

    imgElement.src = posterUrl
    imgElement.alt = movie.title
    titleElementH3.textContent = movie.title
    spanIdElement.textContent = releaseYear

    card.addEventListener('click', () => {
        showMovieDetails(movie)
    })

    return card
}

const showTrending = (movies) => {
    const trendingMoviesGrid = document.querySelector('.trending-movies')
    trendingMoviesGrid.innerHTML = ''

    movies.forEach(movie => {
        const movieCard = createMovieCard(movie)
        trendingMoviesGrid.append(movieCard)
    })
}

const showMovies = (movies) => {
    const allMovieGrid = document.querySelector('.movie-grid')
    allMovieGrid.innerHTML = ''

    movies.forEach(movie => {
        const movieCards = createMovieCard(movie)
        allMovieGrid.append(movieCards)
    })
}

const showMovieDetails = (movie) => {
    const modalBody = document.querySelector('.modal-body')

    const posterUrl = movie.poster_path ? `${IMG_BASE}w1280${movie.poster_path}` : ''
    const releaseYear = movie.release_date ? movie.release_date.slice(0, 4) : 'N/A'
    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : '0.0'
    const originalLang = movie.original_language ? movie.original_language.toUpperCase() : 'N/A'
    const adultText = movie.adult ? 'Yes' : 'No'

    modalBody.innerHTML = `
        <div class="modal-top">
            <img class="modal-poster" src="" alt="">
            <div class="modal-info">
                <h2 class="modal-title"></h2>
                <div class="modal-meta-row">
                    <span class="modal-year"></span>
                </div>
                <div class="modal-rating">

                </div>
                <div class="modal-badge">

                </div>
                <p class="modal-adult">Adult content: <span>${adultText}</span></p>
            </div>
        </div>
        <div class="modal-bottom">
            <h4>About the Movie</h4>
            <p class="modal-overview-text"></p>
        </div>
    `

    modalBody.querySelector('img').src = posterUrl
    modalBody.querySelector('img').alt = movie.title
    modalBody.querySelector('.modal-title').textContent = movie.title
    modalBody.querySelector('.modal-year').textContent = releaseYear
    modalBody.querySelector('.modal-rating').textContent = `⭐ ${rating} / 10`
    modalBody.querySelector('.modal-badge').textContent = `Original language: ${originalLang}`
    modalBody.querySelector('.modal-overview-text').textContent = movie.overview || 'No overview available for this movie.'

    modalOverlay.classList.remove('hidden')
}

if(searchBox) {
    searchBox.addEventListener('submit', e => {
        e.preventDefault()

        const searchValue = searchInput.value.trim()

        if(searchValue === '') {
            return
        }

        currentSearch = searchValue
        page = 1
        lastSuccessfulPage = 1
        currentView = 'search'

        searchMovies(searchValue)
    })
}

const searchMovies = async (searchValue) => {
    prevPageId.disabled = true
    nextPageId.disabled = true

    requestId++

    const myRequestId = requestId

    try {

        if(statusMessage) {
            statusMessage.textContent = 'Loading...'
            statusMessage.classList.remove('hidden')
        }

        const response = await fetch(`${API_BASE}search/movie?query=${encodeURIComponent(searchValue)}&page=${page}`)

        if(!response.ok){
            throw new Error('Failed to search movies')
        }

        const data = await response.json()

        if(requestId !== myRequestId) {
            return
        }

        totalPage = data.total_pages

        if(statusMessage){
            statusMessage.textContent = ''
            statusMessage.classList.add('hidden')
        }

        if(data.results && data.results.length > 0) {
            showMovies(data.results)
            lastSuccessfulPage = page
            pageNumbers.textContent = `Page: ${page}`
        }else {
            const allMovieGrid = document.querySelector('.movie-grid')
            allMovieGrid.innerHTML = '<p>No movies found.</p>'
            pageNumbers.textContent = ''
        }

        console.log(data)
    }catch(e) {
        console.log(e.message, 'An error occurred')

        if(requestId === myRequestId) {

            page = lastSuccessfulPage

            if(statusMessage){
                statusMessage.textContent = 'An error occurred while searching for movies.'
                statusMessage.classList.remove('hidden')
            }
        }

    }finally {

        if(requestId === myRequestId) {
            prevPageId.disabled = (page === 1)
            nextPageId.disabled = (page === totalPage || totalPage === 0)
        }
    }
}

const getTrendingMovies = async () => {

    requestId++

    const myRequestId = requestId

    try {

        nextPageId.disabled = true
        prevPageId.disabled = true

        if(statusMessage){
            statusMessage.textContent = 'Loading...'
            statusMessage.classList.remove('hidden')
        }

        const response = await fetch(`${API_BASE}trending/movie/week?page=${page}`)

        if(!response.ok) {
            throw new Error('Failed to fetch trending movies')
        }

        const data = await response.json()

        if(requestId !== myRequestId) {
            return
        }

        if(currentView !== 'trending') {
            return
        }

        totalPage = data.total_pages

        if(data.results && data.results.length > 0) {

            const trendMovies = data.results

            showMovies(trendMovies)

            pageNumbers.textContent = `Page: ${page}`
            lastSuccessfulPage = page

            if(statusMessage) {
                statusMessage.textContent = ''
                statusMessage.classList.add('hidden')
            }
        }else {
            document.querySelector('.movie-grid').innerHTML = ''
            if(statusMessage) {
                statusMessage.textContent = 'No trending movies found.'
                statusMessage.classList.remove('hidden')
            }
        }

        console.log(data)
    }catch (e) {

        console.log(e.message, 'An error occurred')

        if(requestId === myRequestId) {

            page = lastSuccessfulPage

            if(statusMessage){
                statusMessage.textContent = 'An error occurred while loading trending movies.'
                statusMessage.classList.remove('hidden')
            }
        }

    }finally {

        if(requestId === myRequestId) {
            prevPageId.disabled = (page === 1)
            nextPageId.disabled = (page === totalPage || totalPage === 0)
        }
    }
}

nextBtn.addEventListener('click', () => {
    trendingMovies.scrollBy({ left: 300 })
})

prevBtn.addEventListener('click', () => {
    trendingMovies.scrollBy({ left: -300 })
})

nextPageId.addEventListener('click', () => {

    // Increase page by one
    page++

    if(currentView === 'trending') {
        getTrendingMovies()
    }else if(currentView === 'search') {
        searchMovies(currentSearch)
    }else {
        getMovies()
    }
})

prevPageId.addEventListener('click', () => {
    if(page > 1) {
        page--
    }

    if(currentView === 'trending') {
        getTrendingMovies()
    }else if(currentView === 'search') {
        searchMovies(currentSearch)
    }else {
        getMovies()
    }
})

modalCloseBtn.addEventListener('click', () => {
    modalOverlay.classList.add('hidden')
})

modalOverlay.addEventListener('click', e => {
    if(e.target === modalOverlay) {
        modalOverlay.classList.add('hidden')
    }
})

genreBtns.forEach(btn => {
    btn.addEventListener('click', () => {

        genreBtns.forEach(b => b.classList.remove('active'))

        btn.classList.add('active')
        const genreId = btn.dataset.genre

        currentGenre = genreId
        page = 1
        lastSuccessfulPage = 1
        currentSearch = ''
        searchInput.value = ''
        currentView = 'home'
        getMovies()

        if(currentGenre === 'all') {
            console.log('all movies')
        }else {
            const numericGenreId = genreIds[currentGenre]
            console.log(numericGenreId)
        }
    })
})

yearSelect.addEventListener('change', () => {
    const selectedYear = yearSelect.value

    if(selectedYear === 'all') {
        currentYear = ''
    }else {
        currentYear = selectedYear
    }

    page = 1
    lastSuccessfulPage = 1
    currentSearch = ''
    searchInput.value = ''
    currentView = 'home'

    getMovies()
    console.log(currentYear)
})

sortSelect.addEventListener('change', () => {
    const selectedSort = sortSelect.value
    currentSort = selectedSort

    page = 1
    lastSuccessfulPage = 1
    currentSearch = ''
    searchInput.value = ''
    currentView = 'home'
    getMovies()
    console.log(currentSort)
})

themeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('light-mode')

    if(document.body.classList.contains('light-mode')) {
        themeToggleBtn.textContent = '🌙'
        localStorage.setItem('theme', 'light')
    }else {
        themeToggleBtn.textContent = '☀️'
        localStorage.setItem('theme', 'dark')
    }
})

homeNavLink.addEventListener('click', e => {

    e.preventDefault()

    page = 1
    lastSuccessfulPage = 1
    currentSearch = ''
    currentGenre = 'all'
    currentYear = ''
    currentSort = ''
    searchInput.value = ''
    yearSelect.value = 'all'
    sortSelect.value = ''
    currentView = 'home'

    genreBtns.forEach(btn => {
        btn.classList.remove('active')

        if(btn.dataset.genre === 'all') {
            btn.classList.add('active')
        }
    })

    getMovies()
})

trendNavLink.addEventListener('click', e => {

    e.preventDefault()
    page = 1
    lastSuccessfulPage = 1
    currentSearch = ''
    currentGenre = 'all'
    currentYear = ''
    currentSort = ''
    searchInput.value = ''
    yearSelect.value = 'all'
    sortSelect.value = ''
    currentView = 'trending'

    genreBtns.forEach(btn => {
        btn.classList.remove('active')

        if(btn.dataset.genre === 'all') {
            btn.classList.add('active')
        }
    })

    getTrendingMovies()
})

getMovies()
