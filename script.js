// Data penyimpanan film
let films = [];
let currentFilm = null;
let currentProfile = null;

// Profile Images Storage
let profileImages = {
    profile1: null,
    profile2: null
};

// Load films dari localStorage saat halaman dimuat
window.addEventListener('DOMContentLoaded', () => {
    // Load account data dari localStorage (fallback)
    loadAccountData();
    
    // Load gambar profil
    function loadProfilesWhenReady() {
        const profile1Img = document.getElementById('profile1Image');
        const profile2Img = document.getElementById('profile2Image');
        
        if (profile1Img && profile2Img) {
            loadProfileImages();
        } else {
            setTimeout(loadProfilesWhenReady, 50);
        }
    }
    
    loadProfilesWhenReady();
    
    // Load films dari localStorage terlebih dahulu
    loadFilmsFromStorage();
    films = films || [];
    
    // Validasi dan perbaiki data film yang mungkin corrupt
    validateAndRepairFilmData();
    
    // Check if first time
    const hasInitialized = localStorage.getItem('netflixCloneInitialized');
    if (!hasInitialized) {
        addSampleFilms();
        localStorage.setItem('netflixCloneInitialized', 'true');
    }
    
    renderFilms();
    
    if (films.length > 0) {
        const latestFilm = films[films.length - 1];
        updateHeroSection(latestFilm);
        // Validasi dan perbaiki gambar yang mungkin blank
        verifyFilmImages();
    }
    
    setupPreviewListeners();
    updateStorageInfo();
    
    setTimeout(() => {
        updateProfileNamesFromAccountData();
    }, 100);
    
    // Set up automatic data validation setiap menit
    setInterval(validateAndRepairFilmData, 60000);
    
    // Set up automatic consistency check setiap 2 menit
    setInterval(() => {
        ensureDataConsistency().catch(() => {});
    }, 120000);
    
    if (window.initDatabase) {
        initDatabase()
            .then(() => {
                if (window.migrateDataToDb) return migrateDataToDb();
            })
            .then(() => {
                // Setelah database siap, merge localStorage metadata dengan IndexedDB full data
                return mergeFilmsWithIndexedDB();
            })
            .then(() => {
                // Pastikan consistency setelah merge
                return ensureDataConsistency();
            })
            .then(() => {
                // Render ulang setelah merge untuk tampilkan images dari IndexedDB
                renderFilms();
                if (films.length > 0) {
                    const latestFilm = films[films.length - 1];
                    updateHeroSection(latestFilm);
                }
            })
            .catch(() => {});
    }
});

// Fungsi untuk menambah film sample (hanya sekali saat pertama kali)
function addSampleFilms() {
    const hasInitialized = localStorage.getItem('netflixCloneInitialized');
    if (hasInitialized) return;
    
    if (films.length === 0) {
        const sampleFilms = [
            {
                id: 1,
                title: 'Petualangan Epik',
                description: 'Sebuah perjalanan menakjubkan yang mengubah segalanya. Ikuti para pahlawan dalam misi mereka untuk menyelamatkan dunia.',
                genre: 'Action, Adventure',
                year: 2024,
                poster: 'https://via.placeholder.com/200x280/E50914/ffffff?text=Petualangan+Epik',
                trailer: null,
                subFilms: ['Episode 1: Awal', 'Episode 2: Pengembangan', 'Episode 3: Puncak', 'Episode 4: Penutup']
            },
            {
                id: 2,
                title: 'Cinta di Era Digital',
                description: 'Dua orang bertemu di dunia maya dan menemukan cinta sejati. Sebuah cerita yang menyentuh hati tentang koneksi manusia.',
                genre: 'Romance, Drama',
                year: 2024,
                poster: 'https://via.placeholder.com/200x280/ff1744/ffffff?text=Cinta+Digital',
                trailer: null,
                subFilms: ['Chapter 1', 'Chapter 2', 'Chapter 3', 'Chapter 4', 'Chapter 5']
            },
            {
                id: 3,
                title: 'Misteri di Hutan',
                description: 'Seorang detektif privat harus memecahkan kasus aneh di tengah hutan gelap. Kebenaran lebih menakutkan dari yang dibayangkan.',
                genre: 'Mystery, Thriller',
                year: 2024,
                poster: 'https://via.placeholder.com/200x280/1a1a1a/E50914?text=Misteri',
                trailer: null,
                subFilms: ['Bagian 1', 'Bagian 2', 'Bagian 3']
            },
            {
                id: 4,
                title: 'Komedi Kampus',
                description: 'Petualangan seru sekelompok mahasiswa yang selalu membuat masalah. Tertawa sambil menonton kehidupan mereka yang kacau.',
                genre: 'Comedy',
                year: 2024,
                poster: 'https://via.placeholder.com/200x280/00b4d8/ffffff?text=Komedi',
                trailer: null,
                subFilms: ['Season 1 Ep 1', 'Season 1 Ep 2', 'Season 1 Ep 3']
            }
        ];
        
        films = sampleFilms;
        saveFilmsToStorage();
    }
}

let isProcessing = false;

function addFilm() {
    if (isProcessing) return;

    const titleInput = document.getElementById('filmTitle');
    const descInput = document.getElementById('filmDescription');
    const genreInput = document.getElementById('filmGenre');
    const yearInput = document.getElementById('filmYear');
    const ratingInput = document.getElementById('filmRating');
    const posterInput = document.getElementById('posterImage');
    const trailerInput = document.getElementById('trailerVideo');
    const shortTrailerInput = document.getElementById('shortTrailerVideo');
    const subFilmsInput = document.getElementById('subFilms');

    if (!titleInput || !descInput || !genreInput || !yearInput || !posterInput) {
        alert('Form tidak lengkap. Silakan refresh halaman.');
        return;
    }

    const title = titleInput.value.trim();
    const description = descInput.value.trim();
    const genre = genreInput.value.trim();
    const year = yearInput.value;
    const rating = ratingInput?.value;
    const posterImage = posterInput.files[0];
    const trailerVideo = trailerInput?.files[0];
    const subFilmsValue = subFilmsInput?.value.trim() || '';

    // Validasi input
    if (!title || !description || !genre || !year) {
        alert('Mohon isi semua field yang diperlukan!');
        return;
    }

    if (!posterImage) {
        alert('Mohon upload poster film!');
        return;
    }

    // Validasi ukuran file - Removed untuk support 20GB video storage
    // Sistem akan otomatis handle file size dengan device storage detection
    // Tidak ada batasan hardcoded lagi - semua video besar akan tersimpan di device storage

    // Set flag processing
    isProcessing = true;

    // Tampilkan loading spinner
    showLoading(true);

    // Process files
    let posterBase64 = null;
    let trailerBase64 = null;
    let shortTrailerBase64 = null;
    let posterProcessed = false;
    let trailerProcessed = false;
    let shortTrailerProcessed = false;
    
    // Timeout handler - jika proses terlalu lama
    const timeoutId = setTimeout(() => {
        if (isProcessing) {
            isProcessing = false;
            showLoading(false);
            alert('Proses upload terlalu lama. File mungkin terlalu besar. Silakan coba dengan file yang lebih kecil atau tunggu lebih lama.');
        }
    }, 120000); // 2 menit timeout

    function checkAndCreateFilm() {
        if (posterProcessed && (!trailerVideo || trailerProcessed) && (!shortTrailerInput || shortTrailerProcessed)) {
            createFilmObject();
        }
    }

    // Process poster image
    if (posterImage) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                let posterData = e.target.result;
                
                // Compress gambar jika terlalu besar
                if (posterData.length > 500 * 1024) { // Jika lebih dari 500KB
                    posterData = await compressImage(posterData, 0.7);
                }
                
                posterBase64 = posterData;
                posterProcessed = true;
                checkAndCreateFilm();
            } catch (error) {
                isProcessing = false;
                showLoading(false);
                alert('Error memproses poster: ' + error.message);
            }
        };
        reader.onerror = (error) => {
            clearTimeout(timeoutId);
            isProcessing = false;
            showLoading(false);
            alert('Error membaca file poster. Pastikan file tidak corrupt dan coba lagi.');
        };
        reader.onabort = () => {
            clearTimeout(timeoutId);
            isProcessing = false;
            showLoading(false);
        };
        
        try {
            reader.readAsDataURL(posterImage);
        } catch (error) {
            clearTimeout(timeoutId);
            isProcessing = false;
            showLoading(false);
            alert('Error membaca file poster: ' + error.message);
        }
    }

    // Process trailer video
    if (trailerVideo) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                trailerBase64 = e.target.result;
                trailerProcessed = true;
                checkAndCreateFilm();
            } catch (error) {
                isProcessing = false;
                showLoading(false);
                alert('Error memproses trailer: ' + error.message);
            }
        };
        reader.onerror = (error) => {
            clearTimeout(timeoutId);
            isProcessing = false;
            showLoading(false);
            alert('Error membaca file trailer. Pastikan file tidak corrupt dan coba lagi.');
        };
        reader.onabort = () => {
            clearTimeout(timeoutId);
            isProcessing = false;
            showLoading(false);
        };
        
        try {
            reader.readAsDataURL(trailerVideo);
        } catch (error) {
            clearTimeout(timeoutId);
            isProcessing = false;
            showLoading(false);
            alert('Error membaca file trailer: ' + error.message);
        }
    } else {
        trailerProcessed = true;
        checkAndCreateFilm();
    }

    // Process short trailer video
    const shortTrailerVideo = shortTrailerInput?.files[0];
    if (shortTrailerVideo) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                shortTrailerBase64 = e.target.result;
                shortTrailerProcessed = true;
                checkAndCreateFilm();
            } catch (error) {
                isProcessing = false;
                showLoading(false);
                alert('Error memproses short trailer: ' + error.message);
            }
        };
        reader.onerror = (error) => {
            clearTimeout(timeoutId);
            isProcessing = false;
            showLoading(false);
            alert('Error membaca file short trailer. Pastikan file tidak corrupt dan coba lagi.');
        };
        reader.onabort = () => {
            clearTimeout(timeoutId);
            isProcessing = false;
            showLoading(false);
        };
        
        try {
            reader.readAsDataURL(shortTrailerVideo);
        } catch (error) {
            clearTimeout(timeoutId);
            isProcessing = false;
            showLoading(false);
            alert('Error membaca file short trailer: ' + error.message);
        }
    } else {
        shortTrailerProcessed = true;
        checkAndCreateFilm();
    }

    function createFilmObject() {
        // Clear timeout karena proses selesai
        clearTimeout(timeoutId);
        
        try {
            const subFilmsArray = subFilmsValue
                .split(',')
                .map(item => item.trim())
                .filter(item => item.length > 0);

            // Validasi poster base64
            if (!posterBase64 || posterBase64.length < 100) {
                posterBase64 = 'data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 200 280%27%3E%3Crect fill=%27%23333%27 width=%27200%27 height=%27280%27/%3E%3Ctext x=%27100%27 y=%27140%27 font-size=%2720%27 fill=%27%23666%27 text-anchor=%27middle%27 dominant-baseline=%27middle%27%3E' + title.substring(0, 20).replace(/&/g, '%26').replace(/</g, '%3C').replace(/>/g, '%3E') + '%3C/text%3E%3C/svg%3E';
            }

            const newFilm = {
                id: films.length > 0 ? Math.max(...films.map(f => f.id)) + 1 : 1,
                title: title,
                description: description,
                genre: genre,
                year: parseInt(year),
                rating: rating ? parseFloat(rating) : null,
                poster: posterBase64,
                trailer: trailerBase64,
                shortTrailer: shortTrailerBase64,
                subFilms: subFilmsArray.length > 0 ? subFilmsArray : ['Episode 1']
            };

            films.push(newFilm);
            
            // Simpan ke storage dengan error handling
            const saved = saveFilmsToStorage();
            if (!saved) {
                // Jika gagal simpan, hapus dari array
                films.pop();
                isProcessing = false;
                showLoading(false);
                return; // Keluar tanpa alert sukses
            }
            
            renderFilms();
            updateHeroSection(newFilm);
            clearForm();
            showLoading(false);
            isProcessing = false;
            
            // Scroll ke section trending untuk melihat film baru
            setTimeout(() => {
                const trendingSection = document.getElementById('trending');
                if (trendingSection) {
                    trendingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 100);
            
            alert('Film "' + title + '" berhasil ditambahkan!');
        } catch (error) {
            isProcessing = false;
            showLoading(false);
            alert('Error: ' + error.message);
        }
    }
}

// Fungsi untuk update hero section dengan film terbaru
function updateHeroSection(film) {
    const heroFeatured = document.getElementById('heroFeatured');
    const heroTitle = document.getElementById('heroTitle');
    const heroDescription = document.getElementById('heroDescription');
    
    if (heroFeatured && film.poster) {
        // Test if poster is valid before setting
        const img = new Image();
        img.onload = () => {
            heroFeatured.style.backgroundImage = `url(${film.poster})`;
            heroFeatured.style.backgroundColor = 'transparent';
        };
        img.onerror = () => {
            heroFeatured.style.backgroundColor = '#1a1a1a';
            heroFeatured.style.backgroundImage = 'none';
        };
        img.src = film.poster;
        
        // Set with a timeout as fallback
        setTimeout(() => {
            if (heroFeatured.style.backgroundImage === '') {
                heroFeatured.style.backgroundColor = '#1a1a1a';
            }
        }, 3000);
    }
    
    if (heroTitle) {
        heroTitle.textContent = film.title;
    }
    
    if (heroDescription) {
        heroDescription.textContent = film.description;
    }
}

// Fungsi untuk play featured film
function playFeaturedFilm() {
    if (films.length > 0) {
        const latestFilm = films[films.length - 1];
        openModal(latestFilm.id);
    } else {
        alert('Belum ada film yang tersedia.');
    }
}

// Fungsi untuk show featured info
function showFeaturedInfo() {
    if (films.length > 0) {
        const latestFilm = films[films.length - 1];
        openModal(latestFilm.id);
    } else {
        alert('Belum ada film yang tersedia.');
    }
}

// Fungsi untuk menghapus film
function deleteFilm(filmId) {
    if (!confirm('Apakah Anda yakin ingin menghapus film ini? Film yang dihapus tidak dapat dikembalikan.')) {
        return;
    }

    // Cari film yang akan dihapus untuk mendapatkan informasinya
    const filmToDelete = films.find(film => film.id === filmId);
    if (!filmToDelete) {
        alert('Film tidak ditemukan!');
        return;
    }

    // Hapus film dari array
    const initialLength = films.length;
    films = films.filter(film => film.id !== filmId);
    
    if (films.length === initialLength) {
        alert('Gagal menghapus film. Film tidak ditemukan.');
        return;
    }

    // Simpan perubahan ke localStorage
    const saved = saveFilmsToStorage();
    if (!saved) {
        alert('Gagal menyimpan perubahan. Film mungkin masih muncul setelah refresh.');
        return;
    }
    
    // Hapus dari IndexedDB juga (untuk cleanup total)
    if (typeof deleteFilmFromDb === 'function') {
        deleteFilmFromDb(filmId).catch(err => {
            // Silent fail - sudah dihapus dari localStorage
        });
    }
    
    // Update hero section dengan film terbaru jika ada
    if (films.length > 0) {
        const latestFilm = films[films.length - 1];
        updateHeroSection(latestFilm);
    } else {
        // Jika tidak ada film lagi, reset hero section
        const heroFeatured = document.getElementById('heroFeatured');
        const heroTitle = document.getElementById('heroTitle');
        const heroDescription = document.getElementById('heroDescription');
        
        if (heroFeatured) {
            heroFeatured.style.backgroundImage = '';
        }
        if (heroTitle) {
            heroTitle.textContent = 'Selamat Datang';
        }
        if (heroDescription) {
            heroDescription.textContent = 'Streaming Film & Konten Favorit Anda';
        }
    }

    // Render ulang daftar film
    renderFilms();
    
    // Tutup modal jika terbuka
    closeModal();
    
    // Update storage info
    updateStorageInfo();
    
    // Verifikasi bahwa film benar-benar sudah dihapus dari localStorage
    const verifyStored = localStorage.getItem('netflixCloneFilms');
    if (verifyStored) {
        const verifyFilms = JSON.parse(verifyStored);
        const stillExists = verifyFilms.some(f => f.id === filmId);
        if (stillExists) {
            // Coba hapus lagi
            const cleanedFilms = verifyFilms.filter(f => f.id !== filmId);
            localStorage.setItem('netflixCloneFilms', JSON.stringify(cleanedFilms));
        }
    }
    
    // Tampilkan konfirmasi
    alert('Film "' + filmToDelete.title + '" berhasil dihapus dari semua sumber dan tidak akan muncul lagi!');
}

// Fungsi untuk menampilkan loading
function showLoading(show) {
    const spinner = document.getElementById('loadingSpinner');
    if (show) {
        spinner.classList.add('active');
    } else {
        spinner.classList.remove('active');
    }
}

// Fungsi untuk render semua film
function renderFilms() {
    const trendingCarousel = document.getElementById('trendingCarousel');
    const myListCarousel = document.getElementById('myListCarousel');
    
    if (trendingCarousel) {
        trendingCarousel.innerHTML = '';
    }
    if (myListCarousel) {
        myListCarousel.innerHTML = '';
    }

    films.forEach(film => {
        // Create a safe HTML string for the film card
        const safeTitle = film.title ? film.title.replace(/"/g, '&quot;') : 'Untitled';
        const safeGenre = film.genre ? film.genre.replace(/"/g, '&quot;') : 'N/A';
        const safeYear = film.year || 'N/A';
        
        // Get poster - if not available, will try to load from IndexedDB later
        let posterSrc = film.poster || '';
        
        const filmCardHTML = `
            <img src="${posterSrc}" alt="${safeTitle}" class="film-card-image" 
                 data-film-id="${film.id}"
                 onerror="loadPosterFromIndexedDB(${film.id}, this);"
                 onclick="openModal(${film.id})">
            <div class="film-card-overlay">
                <div class="film-card-title">${safeTitle}</div>
                <div class="film-card-genre">${safeGenre}</div>
                <div class="film-card-year">${safeYear}</div>
            </div>
            <button class="film-delete-btn" onclick="event.stopPropagation(); deleteFilm(${film.id})">Hapus</button>
        `;
        
        if (trendingCarousel) {
            const filmCard = document.createElement('div');
            filmCard.className = 'film-card';
            filmCard.innerHTML = filmCardHTML;
            trendingCarousel.appendChild(filmCard);
        }
        
        if (myListCarousel) {
            const filmCard = document.createElement('div');
            filmCard.className = 'film-card';
            filmCard.innerHTML = filmCardHTML;
            myListCarousel.appendChild(filmCard);
        }
    });
    
    // Update storage info setelah render
    updateStorageInfo();
}

// Fungsi untuk load poster dari IndexedDB jika belum tersedia
function loadPosterFromIndexedDB(filmId, imgElement) {
    if (!imgElement) return;
    
    // Jika sudah ada poster dan valid, jangan perlu load
    if (imgElement.src && imgElement.src.length > 100) {
        return;
    }
    
    // Try load dari IndexedDB
    if (typeof loadFilmsFromDb === 'function') {
        loadFilmsFromDb()
            .then(fullFilms => {
                const fullFilm = fullFilms.find(f => f.id === filmId);
                if (fullFilm && fullFilm.poster && fullFilm.poster.length > 100) {
                    // Update image src dengan poster dari IndexedDB
                    imgElement.src = fullFilm.poster;
                    // Also update di films array
                    const filmInArray = films.find(f => f.id === filmId);
                    if (filmInArray && !filmInArray.poster) {
                        filmInArray.poster = fullFilm.poster;
                    }
                } else {
                    // Jika tidak ada poster, tampilkan placeholder
                    imgElement.onerror = null;
                    imgElement.style.backgroundColor = '#333';
                    imgElement.style.backgroundImage = 'url(data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 100 100%27%3E%3Crect fill=%27%23333%27 width=%27100%27 height=%27100%27/%3E%3Ctext x=%2750%27 y=%2750%27 font-size=%2714%27 fill=%27%23666%27 text-anchor=%27middle%27 dominant-baseline=%27middle%27%3E?%3C/text%3E%3C/svg%3E)';
                    imgElement.style.backgroundSize = 'cover';
                }
            })
            .catch(() => {
                // Silent fail - show placeholder
                imgElement.onerror = null;
                imgElement.style.backgroundColor = '#333';
                imgElement.style.backgroundImage = 'url(data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 100 100%27%3E%3Crect fill=%27%23333%27 width=%27100%27 height=%27100%27/%3E%3Ctext x=%2750%27 y=%2750%27 font-size=%2714%27 fill=%27%23666%27 text-anchor=%27middle%27 dominant-baseline=%27middle%27%3E?%3C/text%3E%3C/svg%3E)';
                imgElement.style.backgroundSize = 'cover';
            });
    } else {
        // loadFilmsFromDb not available yet, show placeholder
        imgElement.onerror = null;
        imgElement.style.backgroundColor = '#333';
        imgElement.style.backgroundImage = 'url(data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 100 100%27%3E%3Crect fill=%27%23333%27 width=%27100%27 height=%27100%27/%3E%3Ctext x=%2750%27 y=%2750%27 font-size=%2714%27 fill=%27%23666%27 text-anchor=%27middle%27 dominant-baseline=%27middle%27%3E?%3C/text%3E%3C/svg%3E)';
        imgElement.style.backgroundSize = 'cover';
    }
}

// Fungsi untuk update storage info di halaman
function updateStorageInfo() {
    const size = getStorageSize();
    const storagePercent = document.getElementById('storagePercent');
    if (storagePercent) {
        storagePercent.textContent = size.percent.toFixed(1);
    }
    
    // Warning jika mendekati penuh
    const storageInfo = document.getElementById('storageInfo');
    if (storageInfo) {
        const displaySize = size.usedGB > 1 ? size.usedGB + 'GB / ' + size.maxGB + 'GB' : size.usedMB + 'MB / ' + size.maxMB + 'MB';
        
        if (size.percent >= 90) {
            storageInfo.style.background = 'rgba(229,9,20,0.3)';
            storageInfo.style.color = '#E50914';
            storageInfo.innerHTML = '⚠️ <strong>Penyimpanan hampir penuh!</strong> ' + displaySize + ' - Klik untuk hapus film lama';
        } else if (size.percent >= 80) {
            storageInfo.style.background = 'rgba(229,9,20,0.15)';
            storageInfo.innerHTML = '<strong>📊 Penyimpanan:</strong> ' + displaySize + ' (' + size.percent.toFixed(1) + '%) - Klik untuk detail';
        } else {
            storageInfo.style.background = 'rgba(229,9,20,0.08)';
            storageInfo.innerHTML = '<strong>📊 Penyimpanan:</strong> ' + displaySize + ' (' + size.percent.toFixed(1) + '%) - Klik untuk detail';
        }
    }
}

// Fungsi untuk tampilkan detail storage
function showStorageDetails() {
    const size = getStorageSize();
    
    let filmDetails = films.map(film => {
        const posterSize = (film.poster.length / 1024).toFixed(1);
        const trailerSize = film.trailer ? (film.trailer.length / 1024 / 1024).toFixed(1) : 0;
        return `
            <div style="padding: 12px; background: rgba(255,255,255,0.05); border-radius: 6px; margin-bottom: 10px;">
                <strong>${film.title}</strong> (${film.year})
                <div style="font-size: 12px; color: rgba(255,255,255,0.6); margin-top: 4px;">
                    Poster: ${posterSize}KB ${trailerSize > 0 ? '| Trailer: ' + trailerSize + 'MB' : ''}
                </div>
            </div>
        `;
    }).join('');
    
    const displaySize = size.usedGB > 1 ? `${size.usedGB}GB / ${size.maxGB}GB` : `${size.usedMB}MB / ${size.maxMB}MB`;
    
    const html = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.95); z-index: 5000; display: flex; align-items: center; justify-content: center;" id="storageDetailsModal">
            <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%); border-radius: 16px; padding: 30px; width: 90%; max-width: 600px; max-height: 80vh; overflow-y: auto; border: 2px solid #E50914;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid rgba(229,9,20,0.3);">
                    <h2 style="color: #E50914; margin: 0; font-size: 22px;">📊 Detail Penyimpanan</h2>
                    <button onclick="document.getElementById('storageDetailsModal').remove();" style="background: none; border: none; color: #E50914; font-size: 28px; cursor: pointer; padding: 0; width: 30px; height: 30px;">×</button>
                </div>
                
                <div style="background: rgba(229,9,20,0.1); padding: 16px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #E50914;">
                    <p style="margin: 8px 0; color: #ffffff;"><strong>Total Penggunaan:</strong> ${displaySize}</p>
                    <p style="margin: 8px 0; color: #ffffff;"><strong>Persentase:</strong> ${size.percent.toFixed(1)}%</p>
                    <p style="margin: 8px 0; color: #ffffff;"><strong>Total Film:</strong> ${films.length}</p>
                    <div style="width: 100%; height: 12px; background: rgba(255,255,255,0.1); border-radius: 6px; margin-top: 12px; overflow: hidden;">
                        <div style="width: ${Math.min(size.percent, 100)}%; height: 100%; background: linear-gradient(90deg, #E50914 0%, #ff1a1a 100%); transition: width 0.3s ease;"></div>
                    </div>
                </div>
                
                <h3 style="color: #E50914; font-size: 14px; text-transform: uppercase; margin-bottom: 12px; letter-spacing: 0.5px;">Detail per Film:</h3>
                <div style="max-height: 300px; overflow-y: auto; margin-bottom: 20px;">
                    ${filmDetails}
                </div>
                
                <p style="color: rgba(255,255,255,0.6); font-size: 12px; margin-bottom: 16px; line-height: 1.5;">
                    💡 <strong>Info Penyimpanan:</strong> Aplikasi menggunakan IndexedDB yang mendukung hingga 8-10GB! Anda bisa menyimpan ratusan film dengan trailernya.
                </p>
                
                <button class="btn btn-secondary" style="width: 100%; padding: 12px;" onclick="document.getElementById('storageDetailsModal').remove();">Tutup</button>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', html);
}

// Fungsi untuk membuka modal
function openModal(filmId) {
    currentFilm = films.find(film => film.id === filmId);
    
    if (!currentFilm) return;

    // Coba load data lengkap dari IndexedDB (dengan trailer/poster)
    if (typeof loadFilmsFromDb === 'function') {
        loadFilmsFromDb().then(fullFilms => {
            const fullFilm = fullFilms.find(f => f.id === filmId);
            if (fullFilm && (fullFilm.trailer || fullFilm.shortTrailer || fullFilm.poster)) {
                // Update currentFilm dengan data lengkap dari IndexedDB
                currentFilm = {
                    ...currentFilm,  // Keep latest metadata
                    ...fullFilm,     // Add poster/trailer dari IndexedDB
                    id: filmId       // Ensure ID consistent
                };
                // Re-render modal dengan data lengkap
                renderModalContent(filmId);
            } else {
                // Jika IndexedDB tidak punya, gunakan yang sudah ada
                renderModalContent(filmId);
            }
        }).catch(() => {
            // Fallback: render dengan data yang ada
            renderModalContent(filmId);
        });
    } else {
        // Jika loadFilmsFromDb tidak available, render langsung
        renderModalContent(filmId);
    }
}

// Fungsi untuk render modal content (dipindahkan dari openModal)
function renderModalContent(filmId) {
    if (!currentFilm) return;
    
    document.getElementById('modalTitle').textContent = currentFilm.title;
    document.getElementById('modalYear').textContent = `Tahun: ${currentFilm.year}`;
    document.getElementById('modalGenre').textContent = `Genre: ${currentFilm.genre}`;
    document.getElementById('modalDescription').textContent = currentFilm.description;

    // Render sub-films
    const subFilmsList = document.getElementById('subFilmsList');
    subFilmsList.innerHTML = '';
    if (currentFilm.subFilms && Array.isArray(currentFilm.subFilms)) {
        currentFilm.subFilms.forEach((subFilm, index) => {
            const tag = document.createElement('span');
            tag.className = 'sub-film-tag';
            tag.textContent = subFilm;
            subFilmsList.appendChild(tag);
        });
    }

    // Render video atau placeholder
    const modalVideo = document.getElementById('modalVideo');
    
    // Helper function untuk create video element with error handling
    const createVideoWithErrorHandling = (src, autoplay = false) => {
        const videoHTML = `
            <video ${autoplay ? 'autoplay' : ''} muted controls style="width: 100%; height: 100%; object-fit: contain;">
                <source src="${src}" type="video/mp4">
                Browser Anda tidak mendukung video tag.
            </video>
        `;
        const container = document.createElement('div');
        container.innerHTML = videoHTML;
        const video = container.querySelector('video');
        
        // Add error handling
        video.addEventListener('error', () => {
            container.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; background: #1a1a1a; color: #ccc; text-align: center; padding: 20px;">⚠️ Video gagal dimuat. Silakan upload ulang trailer.</div>';
        });
        
        return container.innerHTML;
    };
    
    // Helper function untuk create image with error handling
    const createImageWithErrorHandling = (src, alt) => {
        const imgHTML = `
            <img src="${src}" style="width: 100%; height: auto; display: block; object-fit: contain;" alt="${alt}"
                 onerror="this.onerror=null; this.parentElement.innerHTML='<div style=&quot;display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; background: #1a1a1a; color: #ccc; text-align: center;&quot;>⚠️ Gambar gagal dimuat</div>'">
        `;
        return imgHTML;
    };
    
    // Jika ada short trailer, tampilkan short trailer terlebih dahulu
    if (currentFilm.shortTrailer && currentFilm.shortTrailer.length > 0) {
        modalVideo.innerHTML = createVideoWithErrorHandling(currentFilm.shortTrailer, true);
        
        // Setelah 10 detik, ganti ke poster atau trailer utama
        setTimeout(() => {
            if (currentFilm && currentFilm.id === filmId) {
                if (currentFilm.trailer && currentFilm.trailer.length > 0) {
                    modalVideo.innerHTML = createVideoWithErrorHandling(currentFilm.trailer, false);
                } else if (currentFilm.poster && currentFilm.poster.length > 0) {
                    modalVideo.innerHTML = createImageWithErrorHandling(currentFilm.poster, currentFilm.title);
                } else {
                    modalVideo.innerHTML = '<div class="modal-video-placeholder">Tidak ada konten visual tersedia.</div>';
                }
            }
        }, 10000);
    } else if (currentFilm.trailer && currentFilm.trailer.length > 0) {
        modalVideo.innerHTML = createVideoWithErrorHandling(currentFilm.trailer, false);
    } else if (currentFilm.poster && currentFilm.poster.length > 0) {
        modalVideo.innerHTML = createImageWithErrorHandling(currentFilm.poster, currentFilm.title);
    } else {
        modalVideo.innerHTML = '<div class="modal-video-placeholder">Tidak ada trailer atau poster tersedia. Upload trailer untuk menonton preview.</div>';
    }

    // Tampilkan modal
    document.getElementById('filmModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Fungsi untuk menutup modal
function closeModal() {
    document.getElementById('filmModal').style.display = 'none';
    document.body.style.overflow = 'auto';
    currentFilm = null;
}

// Fungsi untuk play trailer
function playTrailer() {
    if (currentFilm && currentFilm.trailer) {
        const video = document.querySelector('.modal-video video');
        if (video) {
            if (video.paused) {
                video.play();
            } else {
                video.pause();
            }
        }
    } else {
        alert('Trailer tidak tersedia untuk film ini.');
    }
}

// Fungsi untuk tambah ke watchlist
function addToWatchlist() {
    if (currentFilm) {
        let watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];
        
        if (!watchlist.find(item => item.id === currentFilm.id)) {
            watchlist.push({
                id: currentFilm.id,
                title: currentFilm.title,
                poster: currentFilm.poster
            });
            localStorage.setItem('watchlist', JSON.stringify(watchlist));
            alert(`"${currentFilm.title}" ditambahkan ke Watchlist!`);
        } else {
            alert(`"${currentFilm.title}" sudah ada di Watchlist.`);
        }
    }
}

// Fungsi untuk clear form
function clearForm() {
    const titleInput = document.getElementById('filmTitle');
    const descInput = document.getElementById('filmDescription');
    const genreInput = document.getElementById('filmGenre');
    const yearInput = document.getElementById('filmYear');
    const ratingInput = document.getElementById('filmRating');
    const posterInput = document.getElementById('posterImage');
    const trailerInput = document.getElementById('trailerVideo');
    const shortTrailerInput = document.getElementById('shortTrailerVideo');
    const subFilmsInput = document.getElementById('subFilms');
    const posterPreview = document.getElementById('posterPreview');
    const trailerPreview = document.getElementById('trailerPreview');
    const shortTrailerPreview = document.getElementById('shortTrailerPreview');
    
    if (titleInput) titleInput.value = '';
    if (descInput) descInput.value = '';
    if (genreInput) genreInput.value = '';
    if (yearInput) yearInput.value = '';
    if (ratingInput) ratingInput.value = '';
    if (posterInput) posterInput.value = '';
    if (trailerInput) trailerInput.value = '';
    if (shortTrailerInput) shortTrailerInput.value = '';
    if (subFilmsInput) subFilmsInput.value = '';
    if (posterPreview) posterPreview.innerHTML = '';
    if (trailerPreview) trailerPreview.innerHTML = '';
    if (shortTrailerPreview) shortTrailerPreview.innerHTML = '';
}

// Setup event listeners untuk preview
function setupPreviewListeners() {
    const posterInput = document.getElementById('posterImage');
    const trailerInput = document.getElementById('trailerVideo');
    
    if (posterInput) {
        posterInput.addEventListener('change', function(e) {
            const preview = document.getElementById('posterPreview');
            const file = e.target.files[0];

            if (file) {
                // Validasi ukuran - support hingga 2GB untuk poster (untuk flexible high quality images)
                if (file.size > 2 * 1024 * 1024 * 1024) {
                    alert('Ukuran file terlalu besar! Maksimal 2 GB.');
                    e.target.value = '';
                    if (preview) preview.innerHTML = '';
                    return;
                }

                // Validasi tipe file
                if (!file.type.startsWith('image/')) {
                    alert('File harus berupa gambar!');
                    e.target.value = '';
                    if (preview) preview.innerHTML = '';
                    return;
                }

                const reader = new FileReader();
                reader.onload = (event) => {
                    if (preview) {
                        preview.innerHTML = `
                            <div style="position: relative;">
                                <img src="${event.target.result}" style="width: 100%; max-width: 300px; border-radius: 5px; display: block;">
                                <button onclick="clearPosterPreview()" style="position: absolute; top: 5px; right: 5px; background: rgba(229, 9, 20, 0.9); color: white; border: none; border-radius: 50%; width: 30px; height: 30px; cursor: pointer; font-size: 18px;">×</button>
                            </div>
                        `;
                    }
                };
                reader.onerror = () => {
                    alert('Error membaca file gambar.');
                    e.target.value = '';
                    if (preview) preview.innerHTML = '';
                };
                reader.readAsDataURL(file);
            } else {
                if (preview) preview.innerHTML = '';
            }
        });
    }

    if (trailerInput) {
        trailerInput.addEventListener('change', function(e) {
            const preview = document.getElementById('trailerPreview');
            const file = e.target.files[0];

            if (file) {
                // Validasi ukuran - support hingga 20GB untuk trailer video
                if (file.size > 20 * 1024 * 1024 * 1024) {
                    alert('Ukuran file terlalu besar! Maksimal 20 GB.');
                    e.target.value = '';
                    if (preview) preview.innerHTML = '';
                    return;
                }

                // Validasi tipe file
                if (!file.type.startsWith('video/')) {
                    alert('File harus berupa video!');
                    e.target.value = '';
                    if (preview) preview.innerHTML = '';
                    return;
                }

                const reader = new FileReader();
                reader.onload = (event) => {
                    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
                    if (preview) {
                        preview.innerHTML = `
                            <div style="position: relative; margin-top: 10px;">
                                <video controls style="width: 100%; max-width: 400px; border-radius: 5px; display: block; background: #000;">
                                    <source src="${event.target.result}" type="${file.type}">
                                    Browser Anda tidak mendukung video player.
                                </video>
                                <div style="margin-top: 5px; color: rgba(255, 255, 255, 0.7); font-size: 12px;">
                                    Ukuran: ${fileSizeMB} MB | Format: ${file.type}
                                </div>
                                <button onclick="clearTrailerPreview()" style="position: absolute; top: 5px; right: 5px; background: rgba(229, 9, 20, 0.9); color: white; border: none; border-radius: 50%; width: 30px; height: 30px; cursor: pointer; font-size: 18px;">×</button>
                            </div>
                        `;
                    }
                };
                reader.onerror = () => {
                    alert('Error membaca file video.');
                    e.target.value = '';
                    if (preview) preview.innerHTML = '';
                };
                reader.readAsDataURL(file);
            } else {
                if (preview) preview.innerHTML = '';
            }
        });
    }

    // Short Trailer Input Event Listener
    const shortTrailerInput = document.getElementById('shortTrailerVideo');
    if (shortTrailerInput) {
        shortTrailerInput.addEventListener('change', function(e) {
            const preview = document.getElementById('shortTrailerPreview');
            const file = e.target.files[0];

            if (file) {
                // Validasi ukuran - support hingga 5GB untuk short trailer
                if (file.size > 5 * 1024 * 1024 * 1024) {
                    alert('Ukuran file terlalu besar! Maksimal 5 GB.');
                    e.target.value = '';
                    if (preview) preview.innerHTML = '';
                    return;
                }

                // Validasi tipe file
                if (!file.type.startsWith('video/')) {
                    alert('File harus berupa video!');
                    e.target.value = '';
                    if (preview) preview.innerHTML = '';
                    return;
                }

                const reader = new FileReader();
                reader.onload = (event) => {
                    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
                    if (preview) {
                        preview.innerHTML = `
                            <div style="position: relative; margin-top: 10px;">
                                <video controls style="width: 100%; max-width: 400px; border-radius: 5px; display: block; background: #000;">
                                    <source src="${event.target.result}" type="${file.type}">
                                    Browser Anda tidak mendukung video player.
                                </video>
                                <div style="margin-top: 5px; color: rgba(255, 255, 255, 0.7); font-size: 12px;">
                                    Ukuran: ${fileSizeMB} MB | Format: ${file.type} | Durasi: ~10 detik
                                </div>
                                <button onclick="clearShortTrailerPreview()" style="position: absolute; top: 5px; right: 5px; background: rgba(229, 9, 20, 0.9); color: white; border: none; border-radius: 50%; width: 30px; height: 30px; cursor: pointer; font-size: 18px;">×</button>
                            </div>
                        `;
                    }
                };
                reader.onerror = () => {
                    alert('Error membaca file short trailer.');
                    e.target.value = '';
                    if (preview) preview.innerHTML = '';
                };
                reader.readAsDataURL(file);
            } else {
                if (preview) preview.innerHTML = '';
            }
        });
    }
}

// Fungsi untuk clear preview
function clearPosterPreview() {
    const posterInput = document.getElementById('posterImage');
    const preview = document.getElementById('posterPreview');
    if (posterInput) posterInput.value = '';
    if (preview) preview.innerHTML = '';
}

function clearTrailerPreview() {
    const trailerInput = document.getElementById('trailerVideo');
    const preview = document.getElementById('trailerPreview');
    if (trailerInput) trailerInput.value = '';
    if (preview) preview.innerHTML = '';
}

function clearShortTrailerPreview() {
    const shortTrailerInput = document.getElementById('shortTrailerVideo');
    const preview = document.getElementById('shortTrailerPreview');
    if (shortTrailerInput) shortTrailerInput.value = '';
    if (preview) preview.innerHTML = '';
}

// Fungsi untuk scroll ke films
function scrollToFilms() {
    const filmsSection = document.getElementById('films');
    filmsSection.scrollIntoView({ behavior: 'smooth' });
}

// Fungsi untuk handle video besar dengan streaming/chunking capability
async function handleLargeVideoFile(file, maxChunkSize = 50 * 1024 * 1024) {
    // Untuk video besar (>100MB), gunakan blob URL langsung tanpa konversi base64
    // Ini menghemat memory dan memungkinkan streaming
    const fileSize = file.size;
    const isLargeFile = fileSize > 100 * 1024 * 1024; // >100MB
    
    if (isLargeFile) {
        // Return blob URL untuk file besar - ini tidak convert ke base64
        // Browser akan handle streaming otomatis
        const blobUrl = URL.createObjectURL(file);
        return {
            type: 'blob-url',
            url: blobUrl,
            size: fileSize,
            isStreaming: true,
            canStream: true
        };
    } else {
        // Untuk file kecil, gunakan data URL normal
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                resolve({
                    type: 'data-url',
                    url: reader.result,
                    size: fileSize,
                    isStreaming: false
                });
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
}

// Fungsi untuk save large video dengan chunking jika diperlukan
async function saveVideoToStorage(videoData, filmId, fieldName = 'trailer') {
    // Cek apakah perlu chunking berdasarkan ukuran
    if (videoData.isStreaming && videoData.canStream) {
        // Untuk streaming video, simpan reference ke blob URL
        // Bukan data URL untuk save memory
        return {
            filmId: filmId,
            field: fieldName,
            type: 'streaming',
            blobUrl: videoData.url,
            size: videoData.size,
            streamable: true
        };
    }
    
    // Default: simpan data URL
    return videoData.url;
}

// Simpan films ke localStorage
// Fungsi untuk compress gambar
function compressImage(base64Data, quality = 0.7) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Set ukuran canvas (maksimal 800px width)
            let width = img.width;
            let height = img.height;
            const maxWidth = 800;
            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }
            
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            
            // Compress ke WebP atau JPEG
            const compressed = canvas.toDataURL('image/jpeg', quality);
            resolve(compressed);
        };
        img.onerror = reject;
        img.src = base64Data;
    });
}

// Fungsi untuk hitung ukuran storage
let cachedStorageSize = null;
let storageSizeCacheTime = 0;

function getStorageSize() {
    // Cache result untuk 5 detik
    const now = Date.now();
    if (cachedStorageSize && (now - storageSizeCacheTime) < 5000) {
        return cachedStorageSize;
    }
    
    // Estimate menggunakan Storage API (untuk IndexedDB) dengan 20GB capacity
    if (navigator.storage && navigator.storage.estimate) {
        navigator.storage.estimate()
            .then(estimate => {
                const maxSize = estimate.quota || (20 * 1024 * 1024 * 1024); // Default 20GB
                const usedSize = estimate.usage || 0;
                const percentUsed = maxSize > 0 ? (usedSize / maxSize) * 100 : 0;
                
                cachedStorageSize = {
                    used: usedSize,
                    max: maxSize,
                    percent: percentUsed,
                    usedMB: (usedSize / 1024 / 1024).toFixed(2),
                    usedGB: (usedSize / 1024 / 1024 / 1024).toFixed(2),
                    maxMB: (maxSize / 1024 / 1024).toFixed(2),
                    maxGB: (maxSize / 1024 / 1024 / 1024).toFixed(2),
                    unlimited: maxSize >= (20 * 1024 * 1024 * 1024) // Flag untuk 20GB+
                };
                storageSizeCacheTime = now;
            });
    }
    
    // Fallback ke localStorage size estimate dengan 20GB default
    if (!cachedStorageSize) {
        const stored = localStorage.getItem('netflixCloneFilms');
        const dataSize = stored ? new Blob([stored]).size : 0;
        const maxSize = 20 * 1024 * 1024 * 1024; // 20GB default capacity
        
        cachedStorageSize = {
            used: dataSize,
            max: maxSize,
            percent: (dataSize / maxSize) * 100,
            usedMB: (dataSize / 1024 / 1024).toFixed(2),
            usedGB: (dataSize / 1024 / 1024 / 1024).toFixed(2),
            maxMB: (maxSize / 1024 / 1024).toFixed(2),
            maxGB: (maxSize / 1024 / 1024 / 1024).toFixed(2),
            unlimited: true
        };
    }
    
    return cachedStorageSize || {
        used: 0,
        max: 20 * 1024 * 1024 * 1024,
        percent: 0,
        usedMB: '0',
        usedGB: '0',
        maxMB: '20000',
        maxGB: '20',
        unlimited: true
    };
}

// Fungsi untuk tampilkan modal storage management
function showStorageModal() {
    const size = getStorageSize();
    
    // Jika storage sudah 95% penuh dari 20GB capacity
    if (size.percent >= 95) {
        showDeleteOldFilmsModal();
    }
}

// Modal untuk hapus film lama
function showDeleteOldFilmsModal() {
    const size = getStorageSize();
    
    let filmsList = films.map(film => `
        <div style="padding: 12px; background: rgba(255,255,255,0.05); border-radius: 6px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
            <div>
                <strong>${film.title}</strong>
                <div style="font-size: 12px; color: rgba(255,255,255,0.6); margin-top: 4px;">
                    ${film.year} • ${film.genre}
                </div>
            </div>
            <button class="btn btn-primary" style="padding: 6px 12px; font-size: 12px;" onclick="deleteFilm(${film.id}); closeDeleteOldFilmsModal();">Hapus</button>
        </div>
    `).join('');
    
    const html = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.95); z-index: 5000; display: flex; align-items: center; justify-content: center;" id="storageModal">
            <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%); border-radius: 16px; padding: 30px; width: 90%; max-width: 500px; max-height: 80vh; overflow-y: auto; border: 2px solid #E50914;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid rgba(229,9,20,0.3);">
                    <h2 style="color: #E50914; margin: 0; font-size: 22px;">⚠️ Penyimpanan Penuh</h2>
                    <button onclick="closeDeleteOldFilmsModal();" style="background: none; border: none; color: #E50914; font-size: 28px; cursor: pointer; padding: 0; width: 30px; height: 30px;">×</button>
                </div>
                
                <div style="background: rgba(229,9,20,0.1); padding: 16px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #E50914;">
                    <p style="margin: 0; color: #ffffff; font-weight: 600;">Penggunaan Penyimpanan: ${size.usedMB}MB / ${size.maxMB}MB (${size.percent.toFixed(1)}%)</p>
                    <div style="width: 100%; height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; margin-top: 10px; overflow: hidden;">
                        <div style="width: ${Math.min(size.percent, 100)}%; height: 100%; background: linear-gradient(90deg, #E50914 0%, #ff1a1a 100%); transition: width 0.3s ease;"></div>
                    </div>
                </div>
                
                <p style="color: rgba(255,255,255,0.8); margin-bottom: 16px;">Untuk menambah film baru, hapus beberapa film lama:</p>
                
                <div style="max-height: 300px; overflow-y: auto; margin-bottom: 20px;">
                    ${filmsList}
                </div>
                
                <button class="btn btn-secondary" style="width: 100%; padding: 12px;" onclick="closeDeleteOldFilmsModal();">Tutup</button>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', html);
}

function closeDeleteOldFilmsModal() {
    const modal = document.getElementById('storageModal');
    if (modal) modal.remove();
}

function saveFilmsToStorage() {
    // Strategi penyimpanan yang cerdas:
    // 1. Metadata (tanpa base64 images) → localStorage (5-10MB quota)
    // 2. Base64 images (poster, trailer) → IndexedDB (20GB+ quota)
    
    try {
        // Pisahkan metadata dari binary data
        const filmsMetadata = films.map(film => ({
            id: film.id,
            title: film.title,
            description: film.description,
            genre: film.genre,
            year: film.year,
            rating: film.rating,
            subFilms: film.subFilms,
            watched: film.watched,
            dateAdded: film.dateAdded
            // Sengaja exclude: poster, trailer, shortTrailer (akan disimpan di IndexedDB)
        }));
        
        const metadataString = JSON.stringify(filmsMetadata);
        const metadataSize = new Blob([metadataString]).size;
        
        // Simpan metadata ke localStorage (jauh lebih ringan)
        localStorage.setItem('netflixCloneFilms', metadataString);
        
        // Verifikasi bahwa data benar-benar tersimpan
        const verify = localStorage.getItem('netflixCloneFilms');
        if (!verify || verify !== metadataString) {
            // Coba lagi sekali
            localStorage.setItem('netflixCloneFilms', metadataString);
        }
    } catch (e) {
        // QuotaExceededError di localStorage? Hapus yang lama dan coba lagi
        if (e.name === 'QuotaExceededError' || e.code === 22) {
            try {
                localStorage.removeItem('netflixCloneFilms');
                // Coba simpan yang sudah dibersihkan
                const filmsMetadata = films.map(film => ({
                    id: film.id,
                    title: film.title,
                    description: film.description,
                    genre: film.genre,
                    year: film.year,
                    rating: film.rating,
                    subFilms: film.subFilms,
                    watched: film.watched,
                    dateAdded: film.dateAdded
                }));
                localStorage.setItem('netflixCloneFilms', JSON.stringify(filmsMetadata));
            } catch (e2) {
                // localStorage completely penuh (sangat jarang karena metadata saja sangat kecil)
                // Tidak perlu alert, IndexedDB akan handle semua
                if (window.saveFilmsToStorageAsync) {
                    return true; // IndexedDB akan handle
                }
            }
        } else if (e.message && e.message.includes('QuotaExceeded')) {
            // Fallback ke IndexedDB saja
            if (window.saveFilmsToStorageAsync) {
                return true;
            }
        } else {
            // Error tipe lain
            // alert('Error menyimpan film: ' + e.message); // Removed console output
            return false;
        }
    }
    
    // Selalu simpan data lengkap (termasuk base64 images) ke IndexedDB
    // IndexedDB memiliki 20GB+ quota dan tidak akan memicu false quota exceeded
    if (window.saveFilmsToStorageAsync) {
        saveFilmsToStorageAsync().catch(err => {
            // Tidak perlu alert karena data sudah tersimpan di metadata
        });
    }
    
    return true;
}

// Fungsi untuk merge metadata dari localStorage dengan full data dari IndexedDB
async function mergeFilmsWithIndexedDB() {
    try {
        // Load full data dari IndexedDB
        let fullFilmsFromDb = [];
        
        // Call loadFilmsFromDb dari global scope (defined di db.js)
        if (typeof loadFilmsFromDb === 'function') {
            fullFilmsFromDb = await loadFilmsFromDb();
        }
        
        if (!Array.isArray(fullFilmsFromDb) || fullFilmsFromDb.length === 0) {
            // Jika IndexedDB kosong, gunakan yang sudah di-load dari localStorage
            return films;
        }
        
        // Create map dari IndexedDB untuk quick lookup
        const dbFilmsMap = new Map();
        fullFilmsFromDb.forEach(film => {
            if (film && film.id) {
                dbFilmsMap.set(film.id, film);
            }
        });
        
        // Merge: ambil metadata dari films (localStorage) dan images dari IndexedDB
        const mergedFilms = films.map(film => {
            const fullFilm = dbFilmsMap.get(film.id);
            if (fullFilm) {
                // Combine: keep updated metadata, add missing images from DB
                return {
                    ...fullFilm,  // Full data dari IndexedDB (includes poster, trailer)
                    ...film,      // Override dengan metadata terbaru dari localStorage
                    id: film.id   // Ensure ID tetap konsisten
                };
            }
            return film;
        });
        
        films = mergedFilms;
        return films;
    } catch (error) {
        // Jika merge gagal, gunakan yang sudah di-load
        return films;
    }
}

// Load films dari localStorage
// Async wrapper untuk load films dari IndexedDB
async function loadFilmsFromDb() {
    try {
        const storedFilms = await loadFilmsFromDb();
        if (Array.isArray(storedFilms)) {
            films = storedFilms.filter(film => {
                return film && 
                       typeof film.id !== 'undefined' && 
                       film.title && 
                       film.poster;
            });
        } else {
            films = [];
        }
    } catch (error) {
        // Fallback ke localStorage lama
        try {
            const stored = localStorage.getItem('netflixCloneFilms');
            if (stored) {
                const parsedFilms = JSON.parse(stored);
                if (Array.isArray(parsedFilms)) {
                    films = parsedFilms;
                    // Simpan ke IndexedDB untuk migrate
                    await saveAllFilmsToDb(films);
                }
            }
        } catch (e) {
            films = [];
        }
    }
}

// Wrapper untuk load account data dari IndexedDB
async function loadAccountDataFromDb() {
    try {
        const accounts = await loadAllAccountsFromDb();
        accountData = {};
        accounts.forEach(acc => {
            const { id, ...data } = acc;
            accountData[id] = data;
        });
    } catch (error) {
        // Fallback ke localStorage
        try {
            const stored = localStorage.getItem('accountData');
            if (stored) {
                accountData = JSON.parse(stored);
                // Migrate to IndexedDB
                for (const [profileId, accData] of Object.entries(accountData)) {
                    await saveAccountToDb(profileId, accData);
                }
            }
        } catch (e) {
            accountData = {};
        }
    }
}

// Async wrapper untuk save films - dengan 20GB storage support
async function saveFilmsToStorageAsync() {
    try {
        const size = getStorageSize();
        const maxSize = 20 * 1024 * 1024 * 1024; // 20GB untuk IndexedDB
        
        // Hanya warning jika sudah mencapai 95% kapasitas 20GB
        if (size.used >= (maxSize * 0.95)) {
            showDeleteOldFilmsModal();
            return false;
        }
        
        // Save lengkap ke IndexedDB (dengan semua data termasuk poster/trailer)
        await saveAllFilmsToDb(films);
        
        // Verifikasi data tersimpan dengan baik
        try {
            const verifyFilms = await loadFilmsFromDb();
            if (!Array.isArray(verifyFilms) || verifyFilms.length !== films.length) {
                // Data mungkin tidak tersimpan dengan sempurna
                // Coba simpan ulang sekali
                await saveAllFilmsToDb(films);
            }
        } catch (verifyError) {
            // Silent fail - data sudah tersimpan di localStorage metadata setidaknya
        }
        
        // Update storage info
        updateStorageInfo();
        return true;
    } catch (error) {
        if (error.name === 'QuotaExceededError' || error.code === 22) {
            showDeleteOldFilmsModal();
            return false;
        }
        return false;
    }
}

// Async wrapper untuk save account data
async function saveAccountDataToDbAsync() {
    try {
        for (const [profileId, accData] of Object.entries(accountData)) {
            await saveAccountToDb(profileId, accData);
        }
        return true;
    } catch (error) {
        return false;
    }
}

function loadFilmsFromStorage() {
    try {
        const stored = localStorage.getItem('netflixCloneFilms');
        if (stored) {
            const parsedFilms = JSON.parse(stored);
            // Validasi bahwa data adalah array
            if (Array.isArray(parsedFilms)) {
                // Validasi setiap film memiliki data yang diperlukan
                // IMPORTANT: Jangan hapus film hanya karena poster kosong - poster mungkin sedang loading dari IndexedDB
                films = parsedFilms.filter(film => {
                    // Pastikan film memiliki id dan title minimal
                    return film && 
                           typeof film.id !== 'undefined' && 
                           film.title;
                });
                
                // Jika ada film yang dihapus karena tidak valid, simpan kembali
                if (films.length !== parsedFilms.length) {
                    saveFilmsToStorage();
                }
                
                // Jangan tambah default poster di sini - nanti IndexedDB akan provide image data
                // Poster akan di-load dari IndexedDB secara async
            } else {
                films = [];
                localStorage.removeItem('netflixCloneFilms');
            }
        } else {
            films = [];
        }
    } catch (error) {
        films = [];
        // Hapus data corrupt
        try {
            localStorage.removeItem('netflixCloneFilms');
        } catch (e) {
        }
    }
}

// Fungsi untuk validasi dan perbaiki data film yang mungkin corrupt
function validateAndRepairFilmData() {
    let needsSave = false;
    
    films.forEach((film, index) => {
        let repaired = false;
        
        // Pastikan film memiliki semua property yang diperlukan
        if (!film.id) {
            film.id = Math.max(...films.map(f => f.id || 0), 0) + 1;
            repaired = true;
        }
        
        if (!film.title) {
            film.title = 'Film Tanpa Judul ' + (index + 1);
            repaired = true;
        }
        
        if (!film.description) {
            film.description = 'Deskripsi tidak tersedia';
            repaired = true;
        }
        
        if (!film.genre) {
            film.genre = 'N/A';
            repaired = true;
        }
        
        if (!film.year) {
            film.year = new Date().getFullYear();
            repaired = true;
        }
        
        if (!film.subFilms || !Array.isArray(film.subFilms)) {
            film.subFilms = ['Episode 1', 'Episode 2', 'Episode 3'];
            repaired = true;
        }
        
        if (!film.poster || typeof film.poster !== 'string' || film.poster.length === 0) {
            film.poster = 'data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 200 280%27%3E%3Crect fill=%27%23333%27 width=%27200%27 height=%27280%27/%3E%3Ctext x=%27100%27 y=%27140%27 font-size=%2720%27 fill=%27%23666%27 text-anchor=%27middle%27 dominant-baseline=%27middle%27%3E' + film.title.substring(0, 20).replace(/&/g, '%26').replace(/</g, '%3C').replace(/>/g, '%3E') + '%3C/text%3E%3C/svg%3E';
            repaired = true;
        }
        
        if (repaired) {
            needsSave = true;
        }
    });
    
    // Simpan jika ada perbaikan
    if (needsSave) {
        saveFilmsToStorage();
    }
}

// Fungsi untuk memastikan konsistensi data di localStorage dan IndexedDB
async function ensureDataConsistency() {
    try {
        // Cek apakah metadata di localStorage sesuai dengan jumlah film di IndexedDB
        const metadataStr = localStorage.getItem('netflixCloneFilms');
        const metadata = metadataStr ? JSON.parse(metadataStr) : [];
        
        let fullFilmsFromDb = [];
        if (typeof loadFilmsFromDb === 'function') {
            fullFilmsFromDb = await loadFilmsFromDb();
        }
        
        // Jika jumlah tidak sesuai, re-sync
        if (Array.isArray(metadata) && Array.isArray(fullFilmsFromDb)) {
            if (metadata.length !== fullFilmsFromDb.length) {
                // Simpan ulang untuk sync
                saveFilmsToStorage();
                if (typeof saveAllFilmsToDb === 'function') {
                    await saveAllFilmsToDb(films);
                }
            }
        }
    } catch (error) {
        // Silent - consistency check failed
    }
}

// Fungsi untuk memverifikasi dan memperbaiki gambar film yang mungkin blank atau tidak tersimpan
function verifyFilmImages() {
    let imageIssuesFound = false;
    
    films.forEach((film, index) => {
        // Cek apakah poster ada dan valid
        if (!film.poster || film.poster.length === 0 || 
            (film.poster.startsWith('data:image') && film.poster.length < 100)) {
            
            // Buat placeholder yang bisa dilihat
            film.poster = 'data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 200 280%27%3E%3Cdefs%3E%3ClinearGradient id=%27grad%27 x1=%270%25%27 y1=%270%25%27 x2=%27100%25%27 y2=%27100%25%27%3E%3Cstop offset=%270%25%27 style=%27stop-color:%23E50914;stop-opacity:0.8%27 /%3E%3Cstop offset=%27100%25%27 style=%27stop-color:%231a1a1a;stop-opacity:1%27 /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width=%27200%27 height=%27280%27 fill=%27url(%23grad)%27/%3E%3Crect x=%275%27 y=%275%27 width=%27190%27 height=%27270%27 fill=%27none%27 stroke=%27%23E50914%27 stroke-width=%272%27/%3E%3Ctext x=%27100%27 y=%2745%27 font-size=%2716%27 font-weight=%27bold%27 fill=%27%23FFF%27 text-anchor=%27middle%27%3E' + film.title.substring(0, 15).replace(/&/g, '%26').replace(/</g, '%3C').replace(/>/g, '%3E').replace(/#/g, '%23').replace(/"/g, '%22') + '%3C/text%3E%3Ctext x=%27100%27 y=%27140%27 font-size=%2760%27 fill=%27%23999%27 text-anchor=%27middle%27 opacity=%270.5%27%3E?%3C/text%3E%3Ctext x=%27100%27 y=%27260%27 font-size=%2712%27 fill=%27%23999%27 text-anchor=%27middle%27%3EMenyimpan gambar...%3C/text%3E%3C/svg%3E';
            
            imageIssuesFound = true;
        }
    });
    
    if (imageIssuesFound) {
        saveFilmsToStorage();
        // Re-render films untuk menampilkan gambar yang diperbaiki
        renderFilms();
    }
}

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    const modal = document.getElementById('filmModal');
    if (event.target == modal) {
        closeModal();
    }
});

// Keyboard shortcut untuk close modal
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeModal();
    }
});

// Smooth scrolling untuk nav links
document.querySelectorAll('.nav-menu a').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        if (targetId === '#home') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            const targetSection = document.querySelector(targetId);
            if (targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth' });
            }
        }
    });
});

// Hide header pada scroll untuk Netflix-like effect
let lastScrollTop = 0;
const header = document.querySelector('.netflix-header');

window.addEventListener('scroll', function() {
    let currentScroll = window.pageYOffset || document.documentElement.scrollTop;
    
    if (currentScroll > lastScrollTop) {
        // Scroll down
        header.style.top = '-100px';
    } else {
        // Scroll up
        header.style.top = '0';
    }
    lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
});

// ============ PROFILE SELECTION FUNCTIONS ============

function loadProfileImages() {
    try {
        const savedImages = localStorage.getItem('profileImages');
        if (savedImages) {
            const parsedImages = JSON.parse(savedImages);
            
            // Update objek profileImages
            if (parsedImages.profile1) {
                profileImages.profile1 = parsedImages.profile1;
            }
            if (parsedImages.profile2) {
                profileImages.profile2 = parsedImages.profile2;
            }
            
            // Update gambar di DOM
            const profile1Img = document.getElementById('profile1Image');
            const profile2Img = document.getElementById('profile2Image');
            
            if (profile1Img && profileImages.profile1) {
                profile1Img.src = profileImages.profile1;
            }
            
            if (profile2Img && profileImages.profile2) {
                profile2Img.src = profileImages.profile2;
            }
        } else {
        }
    } catch (error) {
    }
}

// Fungsi untuk membersihkan data yang tidak diperlukan
function cleanupUnnecessaryData() {
    try {
        let cleaned = false;
        
        // 1. Hapus trailer dari film lama untuk menghemat ruang
        if (films.length > 0) {
            const filmsToClean = [...films];
            filmsToClean.forEach((film, index) => {
                // Hapus trailer dari film yang lebih dari 10 film terakhir
                if (index < films.length - 10 && film.trailer) {
                    film.trailer = null;
                    cleaned = true;
                }
            });
            
            if (cleaned) {
                films = filmsToClean;
                saveFilmsToStorage();
            }
        }
        
        // 2. Hapus watchlist jika terlalu besar
        try {
            const watchlist = localStorage.getItem('watchlist');
            if (watchlist) {
                const watchlistData = JSON.parse(watchlist);
                if (watchlistData.length > 50) {
                    // Hapus watchlist lama, simpan hanya 50 terakhir
                    const cleanedWatchlist = watchlistData.slice(-50);
                    localStorage.setItem('watchlist', JSON.stringify(cleanedWatchlist));
                    cleaned = true;
                }
            }
        } catch (e) {
        }
        
        return cleaned;
    } catch (error) {
        return false;
    }
}

// Fungsi untuk mengompresi gambar sebelum disimpan
function compressImage(imageData, maxWidth = 200, maxHeight = 200, quality = 0.8) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            
            // Hitung ukuran baru
            if (width > height) {
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width = (width * maxHeight) / height;
                    height = maxHeight;
                }
            }
            
            canvas.width = width;
            canvas.height = height;
            
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            try {
                const compressed = canvas.toDataURL('image/jpeg', quality);
                resolve(compressed);
            } catch (error) {
                reject(error);
            }
        };
        img.onerror = reject;
        img.src = imageData;
    });
}

function uploadProfileImage(input, profileImageId) {
    if (input.files && input.files[0]) {
        // Validasi ukuran file
        if (input.files[0].size > 5 * 1024 * 1024) { // 5MB
            alert('Ukuran gambar terlalu besar! Maksimal 5MB.');
            input.value = '';
            return;
        }

        // Validasi tipe file
        if (!input.files[0].type.startsWith('image/')) {
            alert('File harus berupa gambar!');
            input.value = '';
            return;
        }

        // Bersihkan data yang tidak diperlukan terlebih dahulu
        cleanupUnnecessaryData();

        const reader = new FileReader();
        reader.onload = async function(e) {
            try {
                const imgElement = document.getElementById(profileImageId);
                if (!imgElement) {
                    alert('Error: Elemen gambar tidak ditemukan!');
                    return;
                }

                let imageData = e.target.result;
                const profileKey = profileImageId === 'profile1Image' ? 'profile1' : 'profile2';
                
                // Kompresi gambar untuk menghemat ruang
                try {
                    imageData = await compressImage(imageData, 200, 200, 0.85);
                } catch (compressError) {
                    // Lanjutkan dengan gambar asli jika kompresi gagal
                }
                
                // Update gambar di DOM
                imgElement.src = imageData;
                
                // Update objek profileImages
                profileImages[profileKey] = imageData;
                
                // Simpan ke localStorage dengan error handling
                try {
                    const imagesToSave = JSON.stringify(profileImages);
                    const imagesSize = new Blob([imagesToSave]).size;
                    
                    // Cek ukuran sebelum simpan
                    if (imagesSize > 2 * 1024 * 1024) { // 2MB untuk gambar profil
                        alert('Gambar profil terlalu besar setelah kompresi. Silakan gunakan gambar yang lebih kecil.');
                        return;
                    }
                    
                    localStorage.setItem('profileImages', imagesToSave);
                    
                    // Verifikasi bahwa data tersimpan
                    const verify = localStorage.getItem('profileImages');
                    if (verify) {
                        const verifyParsed = JSON.parse(verify);
                        if (verifyParsed[profileKey]) {
                            alert('Gambar profil berhasil diubah dan tersimpan!');
                        } else {
                            alert('Gambar berhasil diubah tapi ada masalah saat menyimpan. Silakan coba lagi.');
                        }
                    } else {
                        alert('Gambar berhasil diubah tapi gagal menyimpan. Silakan coba lagi.');
                    }
                } catch (storageError) {
                    if (storageError.name === 'QuotaExceededError' || storageError.code === 22) {
                        // Coba bersihkan data lagi
                        cleanupUnnecessaryData();
                        alert('Penyimpanan penuh! Data tidak penting telah dibersihkan. Silakan coba upload lagi atau hapus beberapa film lama.');
                    } else {
                        alert('Error menyimpan gambar: ' + storageError.message);
                    }
                }
            } catch (error) {
                alert('Error memproses gambar: ' + error.message);
            }
        };
        reader.onerror = function() {
            alert('Error membaca file gambar. Silakan coba lagi.');
            input.value = '';
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function selectProfile(profile, isMainAccount) {
    currentProfile = profile;
    const profileScreen = document.getElementById('profileScreen');
    const mainApp = document.getElementById('mainApp');
    
    profileScreen.style.display = 'none';
    mainApp.style.display = 'block';
    mainApp.classList.remove('hidden');
}

function handleProfile2Click(event) {
    // Jika klik bukan pada area gambar/upload, baru tampilkan restricted modal
    if (!event.target.closest('.profile-image-wrapper')) {
        restrictedProfile();
    }
}

function restrictedProfile() {
    const restrictedModal = document.getElementById('restrictedModal');
    restrictedModal.classList.add('show');
}

function closeRestrictedModal() {
    const restrictedModal = document.getElementById('restrictedModal');
    restrictedModal.classList.remove('show');
}

// Password Modal Functions
function openPasswordModal() {
    const passwordModal = document.getElementById('passwordModal');
    const passwordInput = document.getElementById('passwordInput');
    passwordModal.classList.add('show');
    passwordInput.value = '';
    passwordInput.focus();
}

function closePasswordModal() {
    const passwordModal = document.getElementById('passwordModal');
    const passwordInput = document.getElementById('passwordInput');
    passwordModal.classList.remove('show');
    passwordInput.value = '';
}

function submitPassword() {
    const passwordInput = document.getElementById('passwordInput');
    const password = passwordInput.value.trim();
    
    if (password === 'INDOMIE') {
        closePasswordModal();
        showUploadForm();
    } else {
        alert('❌ Password salah! Coba lagi.');
        passwordInput.value = '';
        passwordInput.focus();
    }
}

function showUploadForm() {
    const uploadForm = document.getElementById('uploadForm');
    if (uploadForm) {
        uploadForm.style.display = 'block';
        uploadForm.style.animation = 'slideUp 0.5s ease';
        uploadForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

// Tutup password modal ketika menekan ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const passwordModal = document.getElementById('passwordModal');
        if (passwordModal && passwordModal.classList.contains('show')) {
            closePasswordModal();
        }
    }
});

// Tutup password modal ketika klik di luar content
document.addEventListener('click', (e) => {
    const passwordModal = document.getElementById('passwordModal');
    if (passwordModal && passwordModal.classList.contains('show')) {
        if (e.target === passwordModal) {
            closePasswordModal();
        }
    }
});

// Submit password dengan Enter key
document.addEventListener('keypress', (e) => {
    const passwordInput = document.getElementById('passwordInput');
    if (passwordInput && passwordInput === document.activeElement && e.key === 'Enter') {
        submitPassword();
    }
});

// Account Management System
let accountData = {
    profile1: {
        name: 'NAYLA',
        password: null,
        image: null
    },
    profile2: {
        name: 'ZIZO',
        password: null,
        image: null
    }
};

let currentEditingProfile = null;

// Load account data from localStorage
function loadAccountData() {
    const savedData = localStorage.getItem('accountData');
    if (savedData) {
        try {
            accountData = JSON.parse(savedData);
        } catch (e) {
    }
}
}
// Save account data to localStorage dan IndexedDB
function saveAccountData() {
    try {
        localStorage.setItem('accountData', JSON.stringify(accountData));
    } catch (e) {
    }
    
    // Also save to IndexedDB (async)
    saveAccountDataToDbAsync().catch(err => {});
}

// Open Manage Account Modal
function openManageAccountModal(profileId) {
    currentEditingProfile = profileId;
    const modal = document.getElementById('manageAccountModal');
    const nameInput = document.getElementById('manageProfileName');
    const passwordInput = document.getElementById('manageProfilePassword');
    const passwordConfirmInput = document.getElementById('manageProfilePasswordConfirm');
    const imageElement = document.getElementById('manageProfileImage');
    
    // Load current data
    const account = accountData[profileId];
    nameInput.value = account.name || '';
    passwordInput.value = '';
    passwordConfirmInput.value = '';
    
    // Load image
    const imageSrc = document.getElementById(profileId + 'Image').src;
    imageElement.src = imageSrc;
    
    modal.classList.add('show');
}

// Close Manage Account Modal
function closeManageAccountModal() {
    const modal = document.getElementById('manageAccountModal');
    modal.classList.remove('show');
    currentEditingProfile = null;
    
    // Reset form
    document.getElementById('manageProfilePassword').value = '';
    document.getElementById('manageProfilePasswordConfirm').value = '';
}

// Handle image change in manage account
function handleManageImageChange(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validasi ukuran
    if (file.size > 5 * 1024 * 1024) {
        alert('Ukuran gambar terlalu besar! Maksimal 5MB.');
        return;
    }
    
    // Validasi tipe
    if (!file.type.startsWith('image/')) {
        alert('File harus berupa gambar!');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        const imageSrc = e.target.result;
        document.getElementById('manageProfileImage').src = imageSrc;
        accountData[currentEditingProfile].image = imageSrc;
    };
    reader.readAsDataURL(file);
}

// Save Account Changes
function saveAccountChanges() {
    if (!currentEditingProfile) return;
    
    const nameInput = document.getElementById('manageProfileName');
    const passwordInput = document.getElementById('manageProfilePassword');
    const passwordConfirmInput = document.getElementById('manageProfilePasswordConfirm');
    const name = nameInput.value.trim();
    const password = passwordInput.value.trim();
    const passwordConfirm = passwordConfirmInput.value.trim();
    
    // Validasi nama
    if (!name) {
        alert('❌ Nama akun tidak boleh kosong!');
        nameInput.focus();
        return;
    }
    
    if (name.length < 2) {
        alert('❌ Nama akun minimal 2 karakter!');
        nameInput.focus();
        return;
    }
    
    // Validasi password (jika ada)
    if (password || passwordConfirm) {
        if (password !== passwordConfirm) {
            alert('❌ Password tidak cocok!');
            passwordInput.focus();
            return;
        }
        
        if (password.length < 4) {
            alert('❌ Password minimal 4 karakter!');
            passwordInput.focus();
            return;
        }
    }
    
    // Update account data
    accountData[currentEditingProfile].name = name;
    if (password) {
        accountData[currentEditingProfile].password = password;
    }
    
    // Update profile name display
    document.getElementById(currentEditingProfile + 'Image').parentElement.parentElement.querySelector('.profile-name').textContent = name;
    
    // Save to localStorage
    saveAccountData();
    
    // Close modal dengan success message
    alert('✅ Perubahan akun berhasil disimpan!');
    closeManageAccountModal();
}

// Modified selectProfile to check password
function selectProfileWithPassword(profileId, isMainAccount) {
    const account = accountData[profileId];
    
    // If profile has password, ask for it
    if (account && account.password) {
        const enteredPassword = prompt(`Masukkan password untuk akun "${account.name}":`);
        
        if (enteredPassword === null) {
            // User cancelled
            return;
        }
        
        if (enteredPassword !== account.password) {
            // Wrong password
            showPasswordWrongModal();
            return;
        }
    }
    
    // Password correct or no password, proceed
    selectProfile(profileId, isMainAccount);
}

// Show Password Wrong Modal
function showPasswordWrongModal() {
    const modal = document.getElementById('passwordWrongModal');
    modal.classList.add('show');
}

// Close Password Wrong Modal
function closePasswordWrongModal() {
    const modal = document.getElementById('passwordWrongModal');
    modal.classList.remove('show');
}

// Update handleProfile2Click to use password system
// Update profile names from account data after loading
function updateProfileNamesFromAccountData() {
    if (accountData.profile1 && accountData.profile1.name) {
        const profile1Cards = document.querySelectorAll('.profile-card');
        if (profile1Cards.length > 0) {
            const profile1NameElement = profile1Cards[0].querySelector('.profile-name');
            if (profile1NameElement) profile1NameElement.textContent = accountData.profile1.name;
        }
    }
    
    if (accountData.profile2 && accountData.profile2.name) {
        const profile2Cards = document.querySelectorAll('.profile-card');
        if (profile2Cards.length > 1) {
            const profile2NameElement = profile2Cards[1].querySelector('.profile-name');
            if (profile2NameElement) profile2NameElement.textContent = accountData.profile2.name;
        }
    }
}

// Close modals dengan ESC key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const manageModal = document.getElementById('manageAccountModal');
        const passwordWrongModal = document.getElementById('passwordWrongModal');
        
        if (manageModal && manageModal.classList.contains('show')) {
            closeManageAccountModal();
        }
        if (passwordWrongModal && passwordWrongModal.classList.contains('show')) {
            closePasswordWrongModal();
        }
    }
});

// Close modal dengan klik di luar
document.addEventListener('click', (e) => {
    const manageModal = document.getElementById('manageAccountModal');
    const passwordWrongModal = document.getElementById('passwordWrongModal');
    
    if (manageModal && manageModal.classList.contains('show')) {
        if (e.target === manageModal) {
            closeManageAccountModal();
        }
    }
    
    if (passwordWrongModal && passwordWrongModal.classList.contains('show')) {
        if (e.target === passwordWrongModal) {
            closePasswordWrongModal();
        }
    }
});

