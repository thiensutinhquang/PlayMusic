// app.js

// --- NoSleep.js integrated library ---
(function(root) {
  var NoSleep = function() {
    if (this._wakeLock) {
      this._wakeLock.addEventListener('release', function() {
        console.log('Wake Lock released.');
      });
    }
  };

  NoSleep.prototype.enable = function() {
    var self = this;
    if (navigator.wakeLock) {
      navigator.wakeLock.request('screen').then(function(wakeLock) {
        self._wakeLock = wakeLock;
        console.log('Wake Lock active.');
      }).catch(function(err) {
        console.error('Wake Lock request failed: ', err);
      });
    }
  };

  NoSleep.prototype.disable = function() {
    if (this._wakeLock) {
      this._wakeLock.release();
      this._wakeLock = null;
    }
  };

  root.NoSleep = NoSleep;
})(window); // FIX: Changed 'this' to 'window' to correctly attach to the global scope


document.addEventListener('DOMContentLoaded', async () => {
    // ==============================================
    // CẤU HÌNH & BIẾN TOÀN CỤC
    // ==============================================
    const CONFIG = {
        APP_VERSION: '1.3.1',
        API_KEY: "08c897eb7784e03007e0769d01f2ca1c6a2001b4",
        USER_HANDLE: "minhsutinhquang",
        MAX_AUDIO_RETRIES: 3,
        STORAGE_KEYS: {
            APP_VERSION: 'appVersion',
            THEME: 'themeState',
            SHUFFLE: 'isShuffling',
            REPEAT: 'repeatMode',
            FAVORITES: 'favoriteSongIds',
            VOLUME: 'playerVolume',
            PLAYBACK_STATE: 'playbackState',
        },
        CATEGORIES: [
            { id: 'all', name: '🎧 Tất cả' }, { id: 'new', name: '🆕 Mới' },
            { id: 'hot', name: '🔥 Nổi bật' }, { id: 'dieu-thu', name: '🎤 Diệu Thu' },
            { id: 'others', name: '👤 Khác' }, { id: 'phap', name: '📿 Pháp' },
            { id: 'favorites', name: '❤️ Yêu thích' }
        ],
        GENRE_MAP: { 'new': "Pop", 'hot': "Country", 'dieu-thu': "Classical", 'others': "Reggae", 'phap': "Podcasts" },
        LYRICS: {
            FONTS: [
                "'Be Vietnam Pro', sans-serif",
                "Arial, sans-serif",
                "Verdana, sans-serif",
                "Tahoma, sans-serif",
                "'Times New Roman', serif"
            ],
            THEMES: [
                { id: 'auto_day', name: "Sáng", bgColor: "#FFFFFF", textColor: "#1e293b" },
                { id: 'auto_night', name: "Tối", bgColor: "#1e293b", textColor: "#e2e8f0" },
                { id: 'sepia', name: "Vàng Cổ", bgColor: "#fbf3e5", textColor: "#5a4628" },
            ],
            DEFAULT_FONT_SIZE: 18,
            DEFAULT_LINES_PER_PAGE: 15,
            STORAGE_KEYS: {
                FONT_SIZE: 'lyricsFontSize',
                LINES_PER_PAGE: 'linesPerPage',
                FONT_INDEX: 'lyricsFontIndex',
                THEME_ID: 'lyricsThemeId'
            }
        },
        PLATFORM_LINKS: [
            { name: 'YouTube', url: 'https://www.youtube.com/@ThiensuTinhQuang', icon: 'ph-youtube-logo', color: '#FF0000' },
            { name: 'TikTok', url: 'https://www.tiktok.com/@thiensutinhquang', icon: 'ph-tiktok-logo', color: '#000000' },
            { name: 'Facebook', url: 'https://www.facebook.com/groups/minhsutinhquang', icon: 'ph-facebook-logo', color: '#1877F2' },
            { name: 'Telegram', url: 'https://t.me/thiensutinhquang', icon: 'ph-telegram-logo', color: '#24A1DE' },
            { name: 'Zalo', url: 'https://zalo.me/g/vjkhzt168', icon: 'zalo-svg', color: '#0068FF' }
        ],
        APP_THEMES: [
            { id: 'light', name: 'Sáng', bgColor: '#fdfcfb', cardBgColor: '#ffffff', textColor: '#1f2937', textMutedColor: '#64748b', borderColor: '#dbeafe', logoBgColor: '#fef9ef' },
            { id: 'dark', name: 'Tối', bgColor: '#1a1c23', cardBgColor: '#232732', textColor: '#f1f5f9', textMutedColor: '#cbd5e1', borderColor: '#3b4252', logoBgColor: '#1f2530' },
            { id: 'modern', name: 'Hiện đại', bgColor: '#228B22', cardBgColor: '#339B33', textColor: '#FFD700', textMutedColor: '#FFDD77', borderColor: '#44AA44', logoBgColor: '#1A7A1A' },
            { id: 'tinhquang', name: 'MSTQ độc quyền', bgColor: '#1a0b2a', cardBgColor: '#2a1b4a', textColor: '#FFD700', textMutedColor: '#e0e0e0', borderColor: '#4a2a6a', logoBgColor: '#100818' },
            { id: 'zen', name: 'Zen', bgColor: '#e6f0ec', cardBgColor: '#ffffff', textColor: '#1f2937', textMutedColor: '#4b5563', borderColor: '#cbd5e1', logoBgColor: '#f5fdfb' },
            { id: 'midnight', name: 'Midnight', bgColor: '#1a1c23', cardBgColor: '#232732', textColor: '#f1f5f9', textMutedColor: '#cbd5e1', borderColor: '#3b4252', logoBgColor: '#1f2530' },
            { id: 'sunset', name: 'Sunset', bgColor: '#ffedd5', cardBgColor: '#fff7ed', textColor: '#1f2937', textMutedColor: '#4b5563', borderColor: '#fcd34d', logoBgColor: '#fef3c7' },
            { id: 'ocean', name: 'Ocean', bgColor: '#e0f2fe', cardBgColor: '#f0f9ff', textColor: '#0f172a', textMutedColor: '#334155', borderColor: '#bae6fd', logoBgColor: '#e0f7fa' },
            { id: 'classic', name: 'Classic', bgColor: '#fef9ef', cardBgColor: '#ffffff', textColor: '#1e293b', textMutedColor: '#475569', borderColor: '#e2e8f0', logoBgColor: '#f8fafc' },
        ],
        PAGE_SIZE: 50,
    };

    // DOM Elements
    const dom = {
        body: document.body,
        html: document.documentElement,
        header: {
            logoPlaceholder: document.getElementById('header-logo-placeholder'),
            mainTitle: document.querySelector('.main-title'),
            hamburgerMenu: document.getElementById('hamburger-menu'),
            mobileNavOverlay: document.getElementById('mobile-nav-overlay'),
            closeMobileMenu: document.getElementById('close-mobile-menu'),
            networkStatusIndicator: document.getElementById('network-status-indicator'),
        },
        playerBar: {
            container: document.getElementById('player-bar'),
            nowPlayingWrapper: document.getElementById('popup-now-playing-info-wrapper'),
            songTitle: document.getElementById('popup-song-title'),
            songArtist: document.getElementById('popup-song-artist'),
            albumArt: document.getElementById('popup-album-art'),
            playPauseBtn: document.getElementById('popup-play-pause-btn'),
            playIcon: document.getElementById('play-icon'),
            pauseIcon: document.getElementById('pause-icon'),
            progressContainer: document.getElementById('popup-progress-container'),
            progressBar: document.getElementById('popup-progress-bar'),
            currentTime: document.getElementById('popup-current-time'),
            duration: document.getElementById('popup-duration'),
            nextBtn: document.getElementById('popup-next-btn'),
            prevBtn: document.getElementById('popup-prev-btn'),
            shuffleBtn: document.getElementById('popup-shuffle-btn'),
            repeatBtn: document.getElementById('popup-repeat-btn'),
            volumeSlider: document.getElementById('popup-volume-slider'),
            volumePercentage: document.getElementById('volume-percentage'),
            volumeIcon: document.getElementById('volume-icon'),
            favoriteBtn: document.getElementById('popup-favorite-btn'),
            shareBtn: document.getElementById('popup-share-btn'),
            trackNumber: document.getElementById('popup-track-number'),
            mediaSessionIndicator: document.getElementById('media-session-indicator'),
            progressTooltip: document.getElementById('progress-tooltip'),
        },
        playlist: {
            toggleBtn: document.getElementById('toggle-playlist-btn'),
            container: document.getElementById('popup-playlist-container'),
            list: document.getElementById('popup-song-list'),
        },
        lyrics: {
            openBtn: document.getElementById('popup-open-lyrics-btn'),
            popup: document.getElementById('lyrics-fullscreen-popup'),
            closeBtn: document.getElementById('close-lyrics-fullscreen'),
            title: document.getElementById('lyrics-popup-title'),
            content: document.getElementById('full-lyrics-display'),
            leftArrow: document.getElementById('lyrics-left-arrow'),
            rightArrow: document.getElementById('lyrics-right-arrow'),
            pageIndicator: document.getElementById('lyrics-page-indicator'),
            radialMenu: {
                container: document.getElementById('lyrics-radial-menu-container'),
                toggleBtn: document.getElementById('radial-menu-toggle-btn'),
                items: document.querySelectorAll('#lyrics-radial-menu-container .radial-item'),
                downloadBtn: document.getElementById('radial-download-lyrics'),
            }
        },
        mainContent: {
            songsContainer: document.getElementById('song-list-body'),
            categoryMenu: document.getElementById('category-menu'),
            searchInput: document.getElementById('search-input'),
            searchClearBtn: document.getElementById('search-clear-btn'),
            initialLoadingOverlay: document.getElementById('initial-loading-overlay'),
            scrollTrigger: document.getElementById('scroll-trigger'),
            loadingMoreSpinner: document.getElementById('loading-more-spinner'),
        },
        modals: {
            alert: document.getElementById('custom-alert-modal'),
            alertTitle: document.getElementById('custom-alert-title'),
            alertMessage: document.getElementById('custom-alert-message'),
            alertOkBtn: document.getElementById('custom-alert-ok-btn'),
        },
        splashScreen: document.getElementById('splash-screen'),
        scrollNav: {
            container: document.getElementById('scroll-nav-container'),
            toTopBtn: document.getElementById('scroll-to-top-btn'),
            toBottomBtn: document.getElementById('scroll-to-bottom-btn'),
        },
        audioPlayer: document.getElementById('audio-player'),
        audioPreloader: document.getElementById('audio-preloader')
    };
    
    // Global State
    let state = {
        allSongs: [], 
        currentFilteredSongs: [],
        audiusHosts: [],
        currentAudiusHost: null,
        currentSongIndex: -1,
        isPlaying: false,
        isShuffling: false,
        repeatMode: 'all',
        favoriteSongIds: [],
        wakeLock: null,
        noSleep: null,
        preloadController: new AbortController(),
        preloadedSongId: null,
        lastVolume: 1,
        lyrics: {
            pages: [],
            currentPage: 0,
            fontSize: CONFIG.LYRICS.DEFAULT_FONT_SIZE,
            linesPerPage: CONFIG.LYRICS.DEFAULT_LINES_PER_PAGE,
            fontIndex: 0,
            themeId: 'auto_day'
        },
        sleepTimer: { endTime: null, interval: null },
        lastScrollY: 0,
        networkStatus: 'online',
        isFetching: false,
        hasMoreSongsToLoad: true,
        currentOffset: 0,
        userId: null,
        userHasInteracted: false,
    };

    // ==============================================
    // UTILITY & HELPER FUNCTIONS
    // ==============================================
    let messageTimer = null;

    function showMessage(message, title = "Thông báo", autoDismiss = false, duration = 4000) {
        if (messageTimer) clearTimeout(messageTimer);
        dom.modals.alertTitle.textContent = title;
        // Use textContent for security, but allow simple bolding
        dom.modals.alertMessage.innerHTML = escapeHTML(message).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        dom.modals.alertOkBtn.style.display = autoDismiss ? 'none' : 'inline-block';
        dom.modals.alert.classList.add('show');
        if (autoDismiss) {
            messageTimer = setTimeout(hideMessage, duration);
        }
    }

    function hideMessage() {
        dom.modals.alert.classList.remove('show');
        if (messageTimer) {
            clearTimeout(messageTimer);
            messageTimer = null;
        }
    }
    
    function loadAndInjectLogo() {
        dom.header.logoPlaceholder.src = 'https://raw.githubusercontent.com/thiensutinhquang/GiaoLy/main/logo%20Thien%20Su%20Tinh%20Quang.png';
        dom.header.logoPlaceholder.alt = 'Logo Thien Su Tinh Quang';
    }
    
    async function requestWakeLock() {
        if ('wakeLock' in navigator && navigator.wakeLock) {
            try {
                state.wakeLock = await navigator.wakeLock.request('screen');
                console.log('Screen Wake Lock activated.');
            } catch (err) {
                console.warn(`Wake Lock API failed: ${err.name}, ${err.message}. Falling back to NoSleep.js.`);
                if (state.noSleep) {
                    state.noSleep.enable();
                    console.log('NoSleep.js enabled as fallback.');
                }
            }
        } else {
            if (state.noSleep) {
                state.noSleep.enable();
                console.log('Wake Lock API not supported. NoSleep.js enabled.');
            } else {
                console.warn('Wake Lock and NoSleep.js are not available.');
            }
        }
    }

    function releaseWakeLock() {
        if (state.wakeLock) {
            state.wakeLock.release().then(() => {
                state.wakeLock = null;
                console.log('Screen Wake Lock released.');
            });
        }
        if (state.noSleep) {
            state.noSleep.disable();
            console.log('NoSleep.js disabled.');
        }
    }
    
    function triggerHapticFeedback(duration = 50) {
        if (navigator.vibrate) navigator.vibrate(duration);
    }
    
    const debounce = (func, delay) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), delay);
        };
    };
    
    const throttle = (func, limit) => {
        let inThrottle;
        return function() {
            if (!inThrottle) {
                func.apply(this, arguments);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    };

    function escapeHTML(str) {
        const p = document.createElement('p');
        p.textContent = str;
        return p.innerHTML;
    }
    
    // ==============================================
    // STATE & LOCAL STORAGE MANAGEMENT
    // ==============================================
    function saveStateToLocalStorage(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.warn(`Could not save to localStorage: ${e.message}`);
        }
    }

    function loadStateFromLocalStorage(key, defaultValue) {
        try {
            const storedValue = localStorage.getItem(key);
            return storedValue ? JSON.parse(storedValue) : defaultValue;
        } catch (e) {
            console.warn(`Could not load from localStorage: ${e.message}`);
            return defaultValue;
        }
    }
    
    // ==============================================
    // THEME MANAGEMENT
    // ==============================================
    function applyTheme() {
        const theme = loadStateFromLocalStorage(CONFIG.STORAGE_KEYS.THEME, { mode: 'light' });
        dom.body.classList.toggle('dark-mode', theme.mode === 'dark');
        
        const darkModeToggle = document.getElementById('darkModeToggle');
        const darkModeToggleMobile = document.getElementById('darkModeToggleMobile');
        if(darkModeToggle) darkModeToggle.checked = theme.mode === 'dark';
        if(darkModeToggleMobile) darkModeToggleMobile.checked = theme.mode === 'dark';

        if (!CONFIG || !CONFIG.APP_THEMES) {
            console.error("Theme configuration is not available.");
            return;
        }

        let currentThemeObj = CONFIG.APP_THEMES.find(t => t.id === (theme.mode === 'preset' ? theme.id : theme.mode));
        
        if (!currentThemeObj) {
            currentThemeObj = CONFIG.APP_THEMES.find(t => t.id === 'light') || CONFIG.APP_THEMES[0];
        }

        if (currentThemeObj) {
            document.documentElement.style.setProperty('--bg-current', currentThemeObj.bgColor);
            document.documentElement.style.setProperty('--card-bg-current', currentThemeObj.cardBgColor);
            document.documentElement.style.setProperty('--text-current', currentThemeObj.textColor);
            document.documentElement.style.setProperty('--text-muted-current', currentThemeObj.textMutedColor);
            document.documentElement.style.setProperty('--border-current', currentThemeObj.borderColor);
            document.documentElement.style.setProperty('--logo-bg-current', currentThemeObj.logoBgColor);
        }
    }

    function changeTheme(themeId) {
        const themeState = (themeId === 'light' || themeId === 'dark') ? { mode: themeId } : { mode: 'preset', id: themeId };
        saveStateToLocalStorage(CONFIG.STORAGE_KEYS.THEME, themeState);
        applyTheme();
        triggerHapticFeedback(20);
    }

    function renderPresetThemes(containerId) {
        const container = document.getElementById(containerId);
        if (!container || !CONFIG.APP_THEMES) return;
        container.innerHTML = CONFIG.APP_THEMES
            .filter(theme => theme.id !== 'light' && theme.id !== 'dark')
            .map(theme => `<button type="button" class="preset-theme-btn" data-theme="${theme.id}" style="background-color: ${theme.bgColor}; border-color: ${theme.borderColor};" title="${theme.name}"></button>`)
            .join('');
    }

    // ==============================================
    // API & DATA FETCHING (RE-ARCHITECTED)
    // ==============================================
    async function initializeApi() {
        try {
            const response = await fetch(`https://api.audius.co?api_key=${CONFIG.API_KEY}`);
            const hostsData = await response.json();
            state.audiusHosts = hostsData.data;
            state.currentAudiusHost = await Promise.any(state.audiusHosts.map(host => fetch(`${host}/health_check`).then(res => res.ok ? host : Promise.reject())));
            
            const userResponse = await fetch(`${state.currentAudiusHost}/v1/users/search?query=${CONFIG.USER_HANDLE}&app_name=MSTQPlayer&api_key=${CONFIG.API_KEY}`);
            const userData = await userResponse.json();
            state.userId = userData.data[0].id;
            return true;
        } catch (error) {
            console.error("API Initialization Failed:", error);
            showMessage("Không thể kết nối đến máy chủ âm nhạc. Vui lòng thử lại sau.", "Lỗi Mạng", false);
            return false;
        }
    }

    async function fetchSongPage() {
        if (state.isFetching || !state.hasMoreSongsToLoad || !state.userId) return;

        state.isFetching = true;
        dom.mainContent.loadingMoreSpinner.classList.remove('hidden');

        try {
            const url = `${state.currentAudiusHost}/v1/users/${state.userId}/tracks?limit=${CONFIG.PAGE_SIZE}&offset=${state.currentOffset}&app_name=MSTQPlayer&api_key=${CONFIG.API_KEY}`;
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Network response was not ok: ${response.statusText}`);
            }
            const data = await response.json();

            if (data.data && data.data.length > 0) {
                const newSongs = data.data.map(track => ({
                    id: track.id,
                    title: track.title,
                    artist: track.user ? track.user.name : 'N/A',
                    artwork: track.artwork ? track.artwork['150x150'] : '',
                    artwork_full: track.artwork ? track.artwork['480x480'] : '',
                    duration: track.duration,
                    description: track.description || 'Không có lời bài hát.',
                    isFavorite: state.favoriteSongIds.includes(track.id),
                    genre: track.genre || 'N/A',
                    permalink: track.permalink
                }));

                state.allSongs = [...state.allSongs, ...newSongs];
                state.currentOffset += newSongs.length;
                
                const currentCategory = document.querySelector('#category-menu .nav-item.active')?.dataset.category || 'all';
                filterAndDisplaySongs(currentCategory, false); 

            } else {
                state.hasMoreSongsToLoad = false;
            }
        } catch (error) {
            console.error("Failed to fetch song page:", error);
            showMessage("Không thể tải thêm bài hát. Vui lòng kiểm tra kết nối mạng của bạn.", "Lỗi Mạng");
        } finally {
            state.isFetching = false;
            dom.mainContent.loadingMoreSpinner.classList.add('hidden');
        }
    }

    // ==============================================
    // MUSIC PLAYER CORE
    // ==============================================
    function preloadSpecificSong(songId) {
        if (state.preloadedSongId === songId) return; 

        state.preloadController.abort(); 
        state.preloadController = new AbortController();
        state.preloadedSongId = songId;

        const url = `${state.currentAudiusHost}/v1/tracks/${songId}/stream?app_name=MSTQPlayer&api_key=${CONFIG.API_KEY}`;
        fetch(url, { signal: state.preloadController.signal })
            .then(response => response.blob())
            .then(blob => {
                if (state.preloadController.signal.aborted) return;
                if (dom.audioPreloader.src && dom.audioPreloader.src.startsWith('blob:')) {
                    URL.revokeObjectURL(dom.audioPreloader.src);
                }
                const objectURL = URL.createObjectURL(blob);
                dom.audioPreloader.src = objectURL;
                dom.audioPreloader.load();
                console.log(`Preloaded song ID: ${songId}`);
            })
            .catch(err => {
                if (err.name !== 'AbortError') {
                    console.error(`Preload failed for song ID ${songId}:`, err);
                }
            });
    }

    async function playSong(songIndex) {
        if (songIndex < 0 || songIndex >= state.currentFilteredSongs.length) return;
        
        state.currentSongIndex = songIndex;
        const song = state.currentFilteredSongs[songIndex];

        dom.playerBar.playPauseBtn.classList.add('play-pause-loading');
        
        let audioSrc;
        if (song.id === state.preloadedSongId && dom.audioPreloader.src) {
            console.log("Using preloaded source.");
            audioSrc = dom.audioPreloader.src;
        } else {
            console.log("Fetching new source.");
            audioSrc = `${state.currentAudiusHost}/v1/tracks/${song.id}/stream?app_name=MSTQPlayer&api_key=${CONFIG.API_KEY}`;
        }

        dom.audioPlayer.src = audioSrc;
        
        try {
            await dom.audioPlayer.play();
            updateUI();
            dom.audioPreloader.removeAttribute('src');
            state.preloadedSongId = null;
        } catch (error) {
            console.error("Playback error:", error);
            if (error.name === 'NotAllowedError') {
                 showMessage("Trình duyệt đã chặn tự động phát. Vui lòng nhấn nút Play để bắt đầu.", "Thông báo");
            } else {
                showMessage("Không thể phát bài hát này.", "Lỗi", true, 3000);
            }
            dom.playerBar.playPauseBtn.classList.remove('play-pause-loading');
            state.isPlaying = false;
            updateUI();
        }
    }

    const playNext = () => playSong((state.currentSongIndex + 1) % state.currentFilteredSongs.length);
    const playPrev = () => playSong((state.currentSongIndex - 1 + state.currentFilteredSongs.length) % state.currentFilteredSongs.length);

    // ==============================================
    // UI RENDERING & UPDATES (RE-ARCHITECTED)
    // ==============================================
    function renderSkeletonLoader(count = 10) {
        const container = dom.mainContent.songsContainer;
        if (!container) return;
        container.innerHTML = ''; // Clear existing content
        const fragment = document.createDocumentFragment();
        for (let i = 0; i < count; i++) {
            const skeletonItem = document.createElement('div');
            skeletonItem.className = 'song-list-item skeleton';
            skeletonItem.innerHTML = `
                <div class="song-index-play"><span class="index-number"></span></div>
                <div class="song-info">
                    <div class="skeleton-img"></div>
                    <div class="title-artist w-full">
                        <div class="skeleton-text"></div>
                        <div class="skeleton-text-sm"></div>
                    </div>
                </div>
                <div></div> 
                <div class="duration"><div class="skeleton-text-sm w-10"></div></div>
            `;
            fragment.appendChild(skeletonItem);
        }
        container.appendChild(fragment);
    }

    function renderSongs(songsToRender, append = false) {
        const container = dom.mainContent.songsContainer;
        if (!append) {
            container.innerHTML = '';
        }

        if (songsToRender.length === 0 && !append) {
            container.innerHTML = `<div class="empty-state col-span-full"><i class="ph-bold ph-music-notes-slash"></i><p>Không có bài hát nào.</p></div>`;
            return;
        }

        const fragment = document.createDocumentFragment();
        songsToRender.forEach((song, index) => {
            const songItem = document.createElement('div');
            songItem.className = 'song-list-item';
            songItem.dataset.songId = song.id;
            songItem.style.setProperty('--i', container.children.length + index);

            const songIndexSpan = document.createElement('span');
            songIndexSpan.className = 'index-number';
            songIndexSpan.textContent = state.allSongs.indexOf(song) + 1;

            const playButtonDiv = document.createElement('div');
            playButtonDiv.className = 'play-button';
            playButtonDiv.innerHTML = `<i class="ph-bold ph-play"></i>`;

            const songIndexPlayDiv = document.createElement('div');
            songIndexPlayDiv.className = 'song-index-play';
            songIndexPlayDiv.append(songIndexSpan, playButtonDiv);

            const artworkImg = document.createElement('img');
            artworkImg.src = song.artwork;
            artworkImg.alt = song.title;
            artworkImg.className = 'artwork w-10 h-10 rounded-md object-cover';
            artworkImg.loading = 'lazy';

            const titleP = document.createElement('p');
            titleP.className = 'title marquee-text';
            titleP.textContent = song.title;

            const artistP = document.createElement('p');
            artistP.className = 'artist marquee-text';
            artistP.textContent = song.artist;

            const titleArtistDiv = document.createElement('div');
            titleArtistDiv.className = 'title-artist';
            titleArtistDiv.append(titleP, artistP);

            const songInfoDiv = document.createElement('div');
            songInfoDiv.className = 'song-info';
            songInfoDiv.append(artworkImg, titleArtistDiv);

            const lyricsButton = document.createElement('button');
            lyricsButton.type = 'button';
            lyricsButton.className = 'lyrics-button';
            lyricsButton.setAttribute('aria-label', 'Xem lời bài hát');
            lyricsButton.innerHTML = `<i class="ph-bold ph-book-open"></i>`;

            const durationDiv = document.createElement('div');
            durationDiv.className = 'duration';
            durationDiv.textContent = new Date(song.duration * 1000).toISOString().substr(14, 5);
            
            songItem.append(songIndexPlayDiv, songInfoDiv, lyricsButton, durationDiv);
            fragment.appendChild(songItem);
        });
        container.appendChild(fragment);
        addSongEventListeners();
    }

    function addSongEventListeners() {
        dom.mainContent.songsContainer.querySelectorAll('.song-list-item:not(.event-bound)').forEach(item => {
            item.classList.add('event-bound');
            const songId = item.dataset.songId;

            item.addEventListener('click', (e) => {
                if (!state.userHasInteracted) state.userHasInteracted = true;
                if (e.target.closest('.lyrics-button')) return;
                const songIndex = state.currentFilteredSongs.findIndex(s => s.id === songId);
                if (songIndex !== -1) {
                    if (songIndex === state.currentSongIndex) {
                        dom.audioPlayer.paused ? dom.audioPlayer.play() : dom.audioPlayer.pause();
                    } else {
                        playSong(songIndex);
                    }
                }
            });

            item.querySelector('.lyrics-button')?.addEventListener('click', (e) => {
                e.stopPropagation();
                const song = state.allSongs.find(s => s.id === songId);
                if (song) showLyricsFullscreenPopup(song);
            });

            item.addEventListener('mouseenter', () => preloadSpecificSong(songId));
        });
    }
    
    function filterAndDisplaySongs(category, fullRender = true) {
        let filtered;
        if (category === 'favorites') {
            filtered = state.allSongs.filter(s => state.favoriteSongIds.includes(s.id));
        } else if (CONFIG.GENRE_MAP[category]) {
            filtered = state.allSongs.filter(s => s.genre && s.genre.toLowerCase() === CONFIG.GENRE_MAP[category].toLowerCase());
        } else {
            filtered = [...state.allSongs];
        }

        if (state.isShuffling && category !== 'favorites') {
            for (let i = filtered.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [filtered[i], filtered[j]] = [filtered[j], filtered[i]];
            }
        }

        state.currentFilteredSongs = filtered;
        renderSongs(state.currentFilteredSongs, !fullRender);
        updateUI();
    }

    function updateUI() {
        state.isPlaying = !dom.audioPlayer.paused;
        const song = state.currentFilteredSongs[state.currentSongIndex];
        
        if (song) {
            dom.playerBar.songTitle.textContent = song.title;
            dom.playerBar.songArtist.textContent = song.artist;
            dom.playerBar.albumArt.src = song.artwork_full || song.artwork;
            dom.playerBar.albumArt.classList.remove('animate-pulse');
            dom.playerBar.favoriteBtn.classList.toggle('liked', state.favoriteSongIds.includes(song.id));
            dom.playerBar.favoriteBtn.innerHTML = state.favoriteSongIds.includes(song.id) ? '<i class="ph-fill ph-heart"></i>' : '<i class="ph-bold ph-heart"></i>';
            dom.playerBar.trackNumber.textContent = state.currentFilteredSongs.indexOf(song) + 1;
        }

        const isLoading = state.isPlaying && (dom.audioPlayer.readyState < 3 || dom.audioPlayer.seeking);
        dom.playerBar.playPauseBtn.classList.toggle('play-pause-loading', isLoading);
        dom.playerBar.playIcon.classList.toggle('hidden', state.isPlaying || isLoading);
        dom.playerBar.pauseIcon.classList.toggle('hidden', !state.isPlaying || isLoading);

        document.querySelectorAll('.song-list-item').forEach(item => {
            const isActive = item.dataset.songId === song?.id;
            item.classList.toggle('active-song', isActive);
            const indicatorIcon = item.querySelector('.play-button i');
            if (indicatorIcon) {
                if (isActive && isLoading) {
                    indicatorIcon.className = 'ph-bold ph-spinner-gap animate-spin text-primary-color';
                } else {
                    indicatorIcon.className = (isActive && state.isPlaying) ? 'ph-bold ph-speaker-high pulsing-icon text-primary-color' : 'ph-bold ph-play';
                }
            }
        });

        dom.playerBar.repeatBtn.classList.toggle('active-control', state.repeatMode !== 'none');
        dom.playerBar.repeatBtn.innerHTML = state.repeatMode === 'one' ? '<i class="ph-bold ph-repeat-once"></i>' : '<i class="ph-bold ph-repeat"></i>';
        dom.playerBar.shuffleBtn.classList.toggle('active-control', state.isShuffling);

        if (!state.userHasInteracted && state.currentFilteredSongs.length > 0 && !state.isPlaying) {
            dom.playerBar.playPauseBtn.classList.add('attention-bounce');
        } else {
            dom.playerBar.playPauseBtn.classList.remove('attention-bounce');
        }
        
        updateMediaSession();
    }

    function updateMediaSession() {
        if (!('mediaSession' in navigator)) return;
        
        const song = state.currentFilteredSongs[state.currentSongIndex];
        if (!song) {
            navigator.mediaSession.metadata = null;
            navigator.mediaSession.playbackState = "none";
            return;
        }

        navigator.mediaSession.metadata = new MediaMetadata({
            title: song.title,
            artist: song.artist,
            album: 'Âm nhạc MSTQ',
            artwork: [{ src: song.artwork_full, sizes: '512x512', type: 'image/jpeg' }]
        });
        navigator.mediaSession.playbackState = state.isPlaying ? "playing" : "paused";
    }

    // ==============================================
    // LYRICS, SHARE, TIMER, ETC.
    // ==============================================
    function showLyricsFullscreenPopup(song) {
        if (!song) return;
        dom.lyrics.title.textContent = song.title;
        paginateLyrics(song.description);
        applyLyricsThemeAndFontStyles();
        dom.lyrics.popup.classList.add('show');
    }

    function paginateLyrics(text) {
        const lines = text ? text.split('\n').filter(line => line.trim() !== '') : ['Không có lời bài hát.'];
        state.lyrics.pages = [];
        for (let i = 0; i < lines.length; i += state.lyrics.linesPerPage) {
            state.lyrics.pages.push(lines.slice(i, i + state.lyrics.linesPerPage));
        }
        state.lyrics.currentPage = 0;
        displayCurrentLyricsPage();
    }

    function displayCurrentLyricsPage() {
        const { pages, currentPage } = state.lyrics;
        const contentEl = dom.lyrics.content;
        contentEl.innerHTML = ''; // Clear previous content
        if (pages[currentPage]) {
            pages[currentPage].forEach(line => {
                const p = document.createElement('p');
                p.textContent = line; // Use textContent for security
                contentEl.appendChild(p);
            });
        } else {
            const p = document.createElement('p');
            p.textContent = 'Không có lời bài hát.';
            contentEl.appendChild(p);
        }
        
        dom.lyrics.pageIndicator.textContent = `Trang ${currentPage + 1} / ${pages.length || 1}`;
        dom.lyrics.leftArrow.disabled = currentPage === 0;
        dom.lyrics.rightArrow.disabled = currentPage >= pages.length - 1;
    }

    function applyLyricsThemeAndFontStyles() {
        const theme = CONFIG.LYRICS.THEMES.find(t => t.id === state.lyrics.themeId) || CONFIG.LYRICS.THEMES[0];
        const popupContent = dom.lyrics.popup.querySelector('.lyrics-popup-content');
        popupContent.style.backgroundColor = theme.bgColor;
        popupContent.style.color = theme.textColor;
        dom.lyrics.content.style.fontSize = `${state.lyrics.fontSize}px`;
        dom.lyrics.content.style.fontFamily = CONFIG.LYRICS.FONTS[state.lyrics.fontIndex];
    }
    
    async function shareSong() {
        const song = state.currentFilteredSongs[state.currentSongIndex];
        if (!song || !song.permalink) {
            showMessage("Không thể chia sẻ bài hát này.");
            return;
        }
        const shareUrl = new URL(song.permalink, 'https://audius.co').href;
        const shareData = {
            title: `Nghe "${song.title}" - ${song.artist}`,
            text: `Nghe bài hát "${song.title}" của ${song.artist} trên Play Nhạc MSTQ.`,
            url: shareUrl
        };
    
        const copyToClipboard = async () => {
            try {
                await navigator.clipboard.writeText(shareUrl);
                showMessage("Đã sao chép liên kết!", "Thông báo", true, 2500);
            } catch (err) {
                 showMessage("Không thể sao chép liên kết.", "Lỗi");
            }
        };
    
        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                if (err.name !== 'AbortError') await copyToClipboard();
            }
        } else {
            await copyToClipboard();
        }
    }

    function startSleepTimer(minutes) {
        if (minutes <= 0) return;
        cancelSleepTimer();
        state.sleepTimer.endTime = Date.now() + minutes * 60 * 1000;
        state.sleepTimer.interval = setInterval(() => {
            const remaining = state.sleepTimer.endTime - Date.now();
            if (remaining <= 0) {
                dom.audioPlayer.pause();
                cancelSleepTimer();
                showMessage("Hẹn giờ tắt nhạc đã kết thúc.", "Hẹn giờ", true);
            }
            updateSleepTimerDisplay(remaining);
        }, 1000);
    }

    function cancelSleepTimer() {
        if (state.sleepTimer.interval) {
            clearInterval(state.sleepTimer.interval);
            state.sleepTimer.interval = null;
            state.sleepTimer.endTime = null;
            updateSleepTimerDisplay(0);
        }
    }

    function updateSleepTimerDisplay(ms) {
        const displayDesktop = document.getElementById('timer-display-desktop');
        const displayMobile = document.getElementById('timer-display-mobile');
        const totalSeconds = Math.max(0, Math.floor(ms / 1000));
        const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
        const seconds = String(totalSeconds % 60).padStart(2, '0');
        if(displayDesktop) displayDesktop.textContent = `${minutes}:${seconds}`;
        if(displayMobile) displayMobile.textContent = `${minutes}:${seconds}`;
    }
    
    // ==============================================
    // INITIALIZATION
    // ==============================================
    function setupEventListeners() {
        // Player controls
        dom.playerBar.playPauseBtn.addEventListener('click', () => {
            if (!state.userHasInteracted) state.userHasInteracted = true;
            if (state.currentSongIndex === -1 && state.currentFilteredSongs.length > 0) playSong(0);
            else dom.audioPlayer.paused ? dom.audioPlayer.play() : dom.audioPlayer.pause();
        });
        dom.playerBar.nextBtn.addEventListener('click', playNext);
        dom.playerBar.prevBtn.addEventListener('click', playPrev);

        // Audio events
        dom.audioPlayer.addEventListener('play', () => { state.isPlaying = true; updateUI(); requestWakeLock(); });
        dom.audioPlayer.addEventListener('pause', () => { state.isPlaying = false; updateUI(); releaseWakeLock(); });
        dom.audioPlayer.addEventListener('ended', () => { if (state.repeatMode !== 'none') playNext(); });
        dom.audioPlayer.addEventListener('timeupdate', throttle(() => {
            const { currentTime, duration } = dom.audioPlayer;
            if(duration) {
                dom.playerBar.progressBar.style.width = `${(currentTime / duration) * 100}%`;
                dom.playerBar.currentTime.textContent = new Date(currentTime * 1000).toISOString().substr(14, 5);
            }
        }, 500));
        dom.audioPlayer.addEventListener('loadedmetadata', () => {
             dom.playerBar.duration.textContent = new Date(dom.audioPlayer.duration * 1000).toISOString().substr(14, 5);
        });
        dom.audioPlayer.addEventListener('waiting', () => updateUI());
        dom.audioPlayer.addEventListener('playing', () => updateUI());

        // Search
        dom.mainContent.searchInput.addEventListener('input', debounce(e => {
            const query = e.target.value.trim().toLowerCase();
            if (query) {
                if (!window.fuse) window.fuse = new Fuse(state.allSongs, { keys: ['title', 'artist'], threshold: 0.4 });
                state.currentFilteredSongs = window.fuse.search(query).map(result => result.item);
                renderSongs(state.currentFilteredSongs, false);
            } else {
                filterAndDisplaySongs('all', true);
            }
        }, 300));

        // Infinite Scroll
        const observer = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) {
                fetchSongPage();
            }
        }, { rootMargin: '200px' });
        observer.observe(dom.mainContent.scrollTrigger);
    }

    async function initializeApp() {
        try {
            if (typeof NoSleep !== 'undefined') {
                state.noSleep = new NoSleep();
            } else {
                console.warn("NoSleep.js library not loaded or defined.");
            }
        } catch (e) {
            console.error("Error initializing NoSleep.js:", e);
        }

        document.title = `Play Nhạc MSTQ - Ver ${CONFIG.APP_VERSION}`;
        
        state.isShuffling = loadStateFromLocalStorage(CONFIG.STORAGE_KEYS.SHUFFLE, false);
        state.repeatMode = loadStateFromLocalStorage(CONFIG.STORAGE_KEYS.REPEAT, 'all');
        state.favoriteSongIds = loadStateFromLocalStorage(CONFIG.STORAGE_KEYS.FAVORITES, []);
        dom.audioPlayer.volume = loadStateFromLocalStorage(CONFIG.STORAGE_KEYS.VOLUME, 1);
        
        applyTheme();
        loadAndInjectLogo();
        renderPresetThemes('preset-themes-desktop');
        renderPresetThemes('preset-themes-mobile');
        CONFIG.CATEGORIES.forEach(cat => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'nav-item text-xs';
            btn.textContent = cat.name;
            btn.dataset.category = cat.id;
            btn.onclick = () => filterAndDisplaySongs(cat.id, true);
            dom.mainContent.categoryMenu.appendChild(btn);
        });
        document.querySelector('#category-menu .nav-item').classList.add('active');

        setupEventListeners();
        renderSkeletonLoader();
        
        const apiReady = await initializeApi();
        if (apiReady) {
            await fetchSongPage(); 
            if (state.currentFilteredSongs.length > 0) {
                state.currentSongIndex = 0;
                updateUI();
            }
        }
        
        dom.mainContent.initialLoadingOverlay.classList.add('hidden');
        
        const lastVersion = localStorage.getItem(CONFIG.STORAGE_KEYS.APP_VERSION);
        if (lastVersion !== CONFIG.APP_VERSION) {
            localStorage.setItem(CONFIG.APP_VERSION, CONFIG.APP_VERSION);
            showMessage(`Ứng dụng đã được cập nhật lên phiên bản ${CONFIG.APP_VERSION}.`, "Đã cập nhật", true, 4000);
        }
    };

    initializeApp();
});
