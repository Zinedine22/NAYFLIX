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
    // Bersihkan data yang tidak diperlukan saat load
    cleanupUnnecessaryData();
    
    // Load gambar profil - pastikan elemen sudah tersedia
    function loadProfilesWhenReady() {
        const profile1Img = document.getElementById('profile1Image');
        const profile2Img = document.getElementById('profile2Image');
        
        if (profile1Img && profile2Img) {
            loadProfileImages();
        } else {
            // Jika elemen belum tersedia, coba lagi setelah 50ms
            setTimeout(loadProfilesWhenReady, 50);
        }
    }
    
    loadProfilesWhenReady();
    
    loadFilmsFromStorage();
    
    // Cek apakah ini pertama kali aplikasi dibuka
    const hasInitialized = localStorage.getItem('netflixCloneInitialized');
    if (!hasInitialized) {
        // Ini pertama kali, tambahkan film sample
        addSampleFilms();
        localStorage.setItem('netflixCloneInitialized', 'true');
    }
    
    renderFilms();
    
    // Update hero section dengan film terbaru
    if (films.length > 0) {
        const latestFilm = films[films.length - 1];
        updateHeroSection(latestFilm);
    }
    
    // Setup event listeners untuk preview
    setupPreviewListeners();
});

// Fungsi untuk menambah film sample (hanya sekali saat pertama kali)
function addSampleFilms() {
    // Hanya tambahkan jika benar-benar kosong dan belum pernah diinisialisasi
    const hasInitialized = localStorage.getItem('netflixCloneInitialized');
    if (hasInitialized) {
        console.log('Aplikasi sudah diinisialisasi, skip film sample');
        return;
    }
    
    if (films.length === 0) {
        console.log('Menambahkan film sample untuk pertama kali...');
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
        console.log('Film sample berhasil ditambahkan');
    }
}

// Flag untuk mencegah double submit
let isProcessing = false;

// Fungsi untuk menambah film baru
function addFilm() {
    // Cek password terlebih dahulu
    const password = prompt('Masukkan password untuk menambah film baru:');
    if (password !== '220706') {
        alert('❌ Password salah! Akses ditolak.');
        return;
    }

    // Cegah double submit
    if (isProcessing) {
        return;
    }

    const titleInput = document.getElementById('filmTitle');
    const descInput = document.getElementById('filmDescription');
    const genreInput = document.getElementById('filmGenre');
    const yearInput = document.getElementById('filmYear');
    const ratingInput = document.getElementById('filmRating');
    const posterInput = document.getElementById('posterImage');
    const trailerInput = document.getElementById('trailerVideo');
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

    // Validasi ukuran file
    if (posterImage && posterImage.size > 10 * 1024 * 1024) { // 10MB
        alert('Ukuran poster terlalu besar! Maksimal 10MB.');
        return;
    }

    if (trailerVideo && trailerVideo.size > 500 * 1024 * 1024) { // 500MB
        alert('Ukuran trailer terlalu besar! Maksimal 500MB.');
        return;
    }

    // Set flag processing
    isProcessing = true;

    // Tampilkan loading spinner
    showLoading(true);

    // Process files
    let posterBase64 = null;
    let trailerBase64 = null;
    let posterProcessed = false;
    let trailerProcessed = false;
    
    // Timeout handler - jika proses terlalu lama
    const timeoutId = setTimeout(() => {
        if (isProcessing) {
            console.error('Timeout: Proses upload terlalu lama');
            isProcessing = false;
            showLoading(false);
            alert('Proses upload terlalu lama. File mungkin terlalu besar. Silakan coba dengan file yang lebih kecil atau tunggu lebih lama.');
        }
    }, 120000); // 2 menit timeout

    function checkAndCreateFilm() {
        console.log('Checking film creation:', {
            posterProcessed,
            trailerProcessed,
            hasTrailer: !!trailerVideo
        });
        
        if (posterProcessed && (!trailerVideo || trailerProcessed)) {
            console.log('Semua file sudah diproses, membuat film...');
            createFilmObject();
        } else {
            console.log('Masih menunggu file diproses...');
        }
    }

    // Process poster image
    if (posterImage) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                posterBase64 = e.target.result;
                console.log('Poster berhasil di-load. Ukuran base64:', (posterBase64.length / 1024).toFixed(2), 'KB');
                posterProcessed = true;
                checkAndCreateFilm();
            } catch (error) {
                console.error('Error memproses poster:', error);
                isProcessing = false;
                showLoading(false);
                alert('Error memproses poster: ' + error.message);
            }
        };
        reader.onerror = (error) => {
            clearTimeout(timeoutId);
            console.error('FileReader error untuk poster:', error);
            isProcessing = false;
            showLoading(false);
            alert('Error membaca file poster. Pastikan file tidak corrupt dan coba lagi.');
        };
        reader.onabort = () => {
            clearTimeout(timeoutId);
            console.warn('Upload poster dibatalkan');
            isProcessing = false;
            showLoading(false);
        };
        
        try {
            reader.readAsDataURL(posterImage);
        } catch (error) {
            clearTimeout(timeoutId);
            console.error('Error membaca poster:', error);
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
                console.log('Trailer berhasil di-load. Ukuran base64:', (trailerBase64.length / 1024 / 1024).toFixed(2), 'MB');
                trailerProcessed = true;
                checkAndCreateFilm();
            } catch (error) {
                console.error('Error memproses trailer:', error);
                isProcessing = false;
                showLoading(false);
                alert('Error memproses trailer: ' + error.message);
            }
        };
        reader.onerror = (error) => {
            clearTimeout(timeoutId);
            console.error('FileReader error untuk trailer:', error);
            isProcessing = false;
            showLoading(false);
            alert('Error membaca file trailer. Pastikan file tidak corrupt dan coba lagi.');
        };
        reader.onabort = () => {
            clearTimeout(timeoutId);
            console.warn('Upload trailer dibatalkan');
            isProcessing = false;
            showLoading(false);
        };
        
        try {
            reader.readAsDataURL(trailerVideo);
        } catch (error) {
            clearTimeout(timeoutId);
            console.error('Error membaca trailer:', error);
            isProcessing = false;
            showLoading(false);
            alert('Error membaca file trailer: ' + error.message);
        }
    } else {
        trailerProcessed = true;
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
            if (!posterBase64) {
                throw new Error('Poster tidak berhasil di-load. Silakan coba upload lagi.');
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
                subFilms: subFilmsArray.length > 0 ? subFilmsArray : ['Episode 1']
            };

            console.log('Membuat film baru:', newFilm.title);
            console.log('Ukuran poster:', (posterBase64.length / 1024).toFixed(2), 'KB');
            if (trailerBase64) {
                console.log('Ukuran trailer:', (trailerBase64.length / 1024 / 1024).toFixed(2), 'MB');
            }
            
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
            console.error('Error membuat film:', error);
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
        heroFeatured.style.backgroundImage = `url(${film.poster})`;
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

    console.log('Film dihapus:', filmToDelete.title);
    
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
    
    // Verifikasi bahwa film benar-benar sudah dihapus dari localStorage
    const verifyStored = localStorage.getItem('netflixCloneFilms');
    if (verifyStored) {
        const verifyFilms = JSON.parse(verifyStored);
        const stillExists = verifyFilms.some(f => f.id === filmId);
        if (stillExists) {
            console.error('Peringatan: Film masih ada di localStorage setelah hapus!');
            // Coba hapus lagi
            const cleanedFilms = verifyFilms.filter(f => f.id !== filmId);
            localStorage.setItem('netflixCloneFilms', JSON.stringify(cleanedFilms));
            console.log('Film telah dihapus ulang dari storage');
        } else {
            console.log('Verifikasi: Film berhasil dihapus dari storage');
        }
    }
    
    // Tampilkan konfirmasi
    alert('Film "' + filmToDelete.title + '" berhasil dihapus dan tidak akan muncul lagi setelah refresh!');
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
        const filmCardHTML = `
            <img src="${film.poster}" alt="${film.title}" class="film-card-image" onclick="openModal(${film.id})">
            <div class="film-card-overlay">
                <div class="film-card-title">${film.title}</div>
                <div class="film-card-genre">${film.genre}</div>
                <div class="film-card-year">${film.year}</div>
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
}

// Fungsi untuk membuka modal
function openModal(filmId) {
    currentFilm = films.find(film => film.id === filmId);
    
    if (!currentFilm) return;

    document.getElementById('modalTitle').textContent = currentFilm.title;
    document.getElementById('modalYear').textContent = `Tahun: ${currentFilm.year}`;
    document.getElementById('modalGenre').textContent = `Genre: ${currentFilm.genre}`;
    document.getElementById('modalDescription').textContent = currentFilm.description;

    // Render sub-films
    const subFilmsList = document.getElementById('subFilmsList');
    subFilmsList.innerHTML = '';
    currentFilm.subFilms.forEach((subFilm, index) => {
        const tag = document.createElement('span');
        tag.className = 'sub-film-tag';
        tag.textContent = subFilm;
        subFilmsList.appendChild(tag);
    });

    // Render video atau placeholder
    const modalVideo = document.getElementById('modalVideo');
    if (currentFilm.trailer) {
        modalVideo.innerHTML = `<video controls><source src="${currentFilm.trailer}" type="video/mp4"></video>`;
    } else {
        modalVideo.innerHTML = '<div class="modal-video-placeholder">Tidak ada trailer tersedia. Upload trailer untuk menonton preview.</div>';
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
    const subFilmsInput = document.getElementById('subFilms');
    const posterPreview = document.getElementById('posterPreview');
    const trailerPreview = document.getElementById('trailerPreview');
    
    if (titleInput) titleInput.value = '';
    if (descInput) descInput.value = '';
    if (genreInput) genreInput.value = '';
    if (yearInput) yearInput.value = '';
    if (ratingInput) ratingInput.value = '';
    if (posterInput) posterInput.value = '';
    if (trailerInput) trailerInput.value = '';
    if (subFilmsInput) subFilmsInput.value = '';
    if (posterPreview) posterPreview.innerHTML = '';
    if (trailerPreview) trailerPreview.innerHTML = '';
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
                // Validasi ukuran
                if (file.size > 10 * 1024 * 1024) {
                    alert('Ukuran file terlalu besar! Maksimal 10MB.');
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
                // Validasi ukuran
                if (file.size > 500 * 1024 * 1024) {
                    alert('Ukuran file terlalu besar! Maksimal 500MB.');
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

// Fungsi untuk scroll ke films
function scrollToFilms() {
    const filmsSection = document.getElementById('films');
    filmsSection.scrollIntoView({ behavior: 'smooth' });
}

// Simpan films ke localStorage
function saveFilmsToStorage() {
    try {
        // Cek ukuran data sebelum simpan
        const dataString = JSON.stringify(films);
        const dataSize = new Blob([dataString]).size;
        const maxSize = 5 * 1024 * 1024; // 5MB limit untuk localStorage
        
        if (dataSize > maxSize) {
            console.warn('Data terlalu besar untuk localStorage. Ukuran:', (dataSize / 1024 / 1024).toFixed(2), 'MB');
            // Hapus film lama jika terlalu besar
            if (films.length > 1) {
                films.shift(); // Hapus film pertama
                return saveFilmsToStorage(); // Coba lagi
            } else {
                alert('Data terlalu besar! Silakan hapus beberapa film lama atau gunakan file yang lebih kecil.');
                return false;
            }
        }
        
        localStorage.setItem('netflixCloneFilms', dataString);
        
        // Pastikan flag initialized sudah ada
        if (!localStorage.getItem('netflixCloneInitialized')) {
            localStorage.setItem('netflixCloneInitialized', 'true');
        }
        
        console.log('Film berhasil disimpan. Total:', films.length, 'film');
        return true;
    } catch (error) {
        console.error('Error menyimpan film:', error);
        
        // Cek jika error karena quota exceeded
        if (error.name === 'QuotaExceededError' || error.code === 22) {
            alert('Penyimpanan penuh! Silakan hapus beberapa film lama atau gunakan file yang lebih kecil.');
            
            // Coba hapus film lama
            if (films.length > 1) {
                const removed = films.shift();
                console.log('Menghapus film lama:', removed.title);
                return saveFilmsToStorage(); // Coba lagi
            }
        } else {
            alert('Error menyimpan film: ' + error.message);
        }
        return false;
    }
}

// Load films dari localStorage
function loadFilmsFromStorage() {
    try {
        const stored = localStorage.getItem('netflixCloneFilms');
        if (stored) {
            const parsedFilms = JSON.parse(stored);
            // Validasi bahwa data adalah array
            if (Array.isArray(parsedFilms)) {
                // Validasi setiap film memiliki data yang diperlukan
                films = parsedFilms.filter(film => {
                    // Pastikan film memiliki id, title, dan poster minimal
                    return film && 
                           typeof film.id !== 'undefined' && 
                           film.title && 
                           film.poster;
                });
                
                // Jika ada film yang dihapus karena tidak valid, simpan kembali
                if (films.length !== parsedFilms.length) {
                    console.warn('Beberapa film tidak valid dan dihapus:', parsedFilms.length - films.length);
                    saveFilmsToStorage();
                }
                
                console.log('Film dimuat dari storage:', films.length, 'film');
            } else {
                console.warn('Data di localStorage bukan array, reset...');
                films = [];
                localStorage.removeItem('netflixCloneFilms');
            }
        } else {
            console.log('Tidak ada data film di storage');
            films = [];
        }
    } catch (error) {
        console.error('Error memuat film dari storage:', error);
        console.warn('Mencoba memperbaiki data corrupt...');
        films = [];
        // Hapus data corrupt
        try {
            localStorage.removeItem('netflixCloneFilms');
            console.log('Data corrupt telah dihapus');
        } catch (e) {
            console.error('Error menghapus data corrupt:', e);
        }
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
                console.log('Gambar profil 1 dimuat dari storage');
            }
            
            if (profile2Img && profileImages.profile2) {
                profile2Img.src = profileImages.profile2;
                console.log('Gambar profil 2 dimuat dari storage');
            }
        } else {
            console.log('Tidak ada gambar profil yang tersimpan');
        }
    } catch (error) {
        console.error('Error memuat gambar profil:', error);
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
                    console.log('Menghapus trailer dari film lama:', film.title);
                    film.trailer = null;
                    cleaned = true;
                }
            });
            
            if (cleaned) {
                films = filmsToClean;
                saveFilmsToStorage();
                console.log('Data dibersihkan: Trailer dari film lama dihapus');
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
                    console.log('Watchlist dibersihkan:', watchlistData.length - 50, 'item dihapus');
                    cleaned = true;
                }
            }
        } catch (e) {
            console.warn('Error membersihkan watchlist:', e);
        }
        
        return cleaned;
    } catch (error) {
        console.error('Error membersihkan data:', error);
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
                    console.log('Gambar dikompresi untuk menghemat ruang');
                } catch (compressError) {
                    console.warn('Gagal mengompresi gambar, menggunakan gambar asli:', compressError);
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
                            console.log('Gambar profil berhasil disimpan dan diverifikasi:', profileKey);
                            alert('Gambar profil berhasil diubah dan tersimpan!');
                        } else {
                            console.error('Verifikasi gagal: Data tidak sesuai');
                            alert('Gambar berhasil diubah tapi ada masalah saat menyimpan. Silakan coba lagi.');
                        }
                    } else {
                        console.error('Verifikasi gagal: Data tidak ditemukan di storage');
                        alert('Gambar berhasil diubah tapi gagal menyimpan. Silakan coba lagi.');
                    }
                } catch (storageError) {
                    console.error('Error menyimpan ke localStorage:', storageError);
                    if (storageError.name === 'QuotaExceededError' || storageError.code === 22) {
                        // Coba bersihkan data lagi
                        cleanupUnnecessaryData();
                        alert('Penyimpanan penuh! Data tidak penting telah dibersihkan. Silakan coba upload lagi atau hapus beberapa film lama.');
                    } else {
                        alert('Error menyimpan gambar: ' + storageError.message);
                    }
                }
            } catch (error) {
                console.error('Error memproses gambar:', error);
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

