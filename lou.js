// 1. LOGIKA GANTI TEMA (LIGHT/DARK MODE)
function toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark');
    try { localStorage.setItem('tema', isDark ? 'dark' : 'light'); } catch (e) {} // ingat pilihan tema antar halaman
}

// ================= LOGIKA LOADING SCREEN =================
window.addEventListener('load', function () {
    const loadingScreen = document.getElementById('loading-screen');
    if (!loadingScreen) return;

    // Tampil minimal 0.5 detik agar tidak berkedip
    setTimeout(() => {
        loadingScreen.style.opacity = '0';
        loadingScreen.style.pointerEvents = 'none';

        // Hapus dari layar setelah fade selesai (sesuai duration-700 di HTML)
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 700);
    }, 500);
});

// 2. LOGIKA GANTI FOTO PROFIL
const profilePhotos = [
    "profil/1.jpeg", // Foto 1
    "profil/2.jpeg"  // Foto 2
];
let profileIndex = 0;

(function () {
    const img = document.getElementById('profileImg');
    if (!img) return;
    img.addEventListener('error', function () { img.classList.add('is-broken'); });
    img.addEventListener('load', function () { img.classList.remove('is-broken'); });
    if (img.complete && img.naturalWidth === 0) img.classList.add('is-broken');
})();
let profileBusy = false;

// Efek bintang saat foto profil diklik
function burstStars(el) {
    if (!el) return;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const colors = ['#ffd166', '#ff6b6b', '#4dabf7', '#06d6a0', '#b197fc', '#ff9f43'];
    const total = 14;
    for (let i = 0; i < total; i++) {
        const s = document.createElement('span');
        const angle = (i / total) * Math.PI * 2 + Math.random() * 0.4;
        const dist = r.width * 0.55 + Math.random() * 60;
        s.className = 'star';
        s.setAttribute('aria-hidden', 'true');
        s.textContent = '\u2605';
        s.style.left = cx + 'px';
        s.style.top = cy + 'px';
        s.style.color = colors[i % colors.length];
        s.style.fontSize = (12 + Math.random() * 14) + 'px';
        s.style.setProperty('--dx', Math.cos(angle) * dist + 'px');
        s.style.setProperty('--dy', Math.sin(angle) * dist + 'px');
        document.body.appendChild(s);
        setTimeout(function () { s.remove(); }, 1000);
    }
}

function toggleProfile() {
    if (profileBusy) return; // cegah klik beruntun saat transisi
    profileBusy = true;
    burstStars(document.querySelector('.profile-container'));

    const img = document.getElementById('profileImg');
    profileIndex = (profileIndex + 1) % profilePhotos.length;

    // Muat foto berikutnya dulu supaya pergantiannya mulus
    const next = new Image();
    next.src = profilePhotos[profileIndex];

    img.classList.add('fade-out');

    setTimeout(() => {
        img.src = profilePhotos[profileIndex];
        img.classList.remove('fade-out');
        profileBusy = false;
    }, 350);
}

// 3. LOGIKA PINDAH TAB GALERI
function switchTab(tabName) {
    const btnDesign = document.getElementById('btn-design');
    const btnPhoto = document.getElementById('btn-photo');
    const galleryDesign = document.getElementById('gallery-design');
    const galleryPhoto = document.getElementById('gallery-photo');

    if (!btnDesign || !btnPhoto || !galleryDesign || !galleryPhoto) return; // halaman ini tidak punya kedua tab

    const isDesign = tabName === 'design';

    btnDesign.classList.toggle('active-tab', isDesign);
    btnPhoto.classList.toggle('active-tab', !isDesign);

    galleryDesign.classList.toggle('gallery-visible', isDesign);
    galleryDesign.classList.toggle('gallery-hidden', !isDesign);
    galleryPhoto.classList.toggle('gallery-visible', !isDesign);
    galleryPhoto.classList.toggle('gallery-hidden', isDesign);
}

// 4. LIGHTBOX: klik / ketuk 2 kali pada foto atau desain untuk full screen
(function () {
    const DOUBLE_CLICK_MS = 350; // jarak maksimal antar dua klik
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const closeBtn = document.getElementById('lightbox-close');
    if (!lightbox || !lightboxImg) return;

    let lastCard = null;
    let lastTime = 0;
    let lastFocused = null;

    function openLightbox(card) {
        const img = card.querySelector('img');
        if (!img) return;

        lastFocused = document.activeElement;
        lightboxImg.src = img.currentSrc || img.src;
        lightboxImg.alt = img.alt || '';

        lightbox.classList.add('is-open');
        lightbox.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        closeBtn.focus({ preventScroll: true });
    }

    function closeLightbox() {
        if (!lightbox.classList.contains('is-open')) return;
        lightbox.classList.remove('is-open');
        lightbox.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        if (lastFocused && lastFocused.focus) lastFocused.focus({ preventScroll: true });
    }

    document.querySelectorAll('.card').forEach(function (card) {
        card.setAttribute('title', 'Klik 2 kali untuk memperbesar');
        card.setAttribute('tabindex', '0');
        card.setAttribute('role', 'button');

        // Mouse & layar sentuh: dua klik/ketukan berurutan pada kartu yang sama
        card.addEventListener('click', function () {
            const now = Date.now();
            if (lastCard === card && now - lastTime < DOUBLE_CLICK_MS) {
                lastCard = null;
                lastTime = 0;
                openLightbox(card);
            } else {
                lastCard = card;
                lastTime = now;
            }
        });

        // Keyboard: Enter / Spasi membuka gambar
        card.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openLightbox(card);
            }
        });
    });

    // Tutup: klik di mana saja, tombol X, atau tombol Esc
    lightbox.addEventListener('click', closeLightbox);
    closeBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        closeLightbox();
    });
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeLightbox();
    });
})();

// 5. GALERI MASONRY (laptop/tablet): foto tampil utuh, disusun ke kolom terpendek
//    Di HP tetap memakai grid 1 kolom seperti sebelumnya.
(function () {
    const mq = window.matchMedia('(min-width: 769px)');

    const galleries = Array.from(document.querySelectorAll('.gallery-container')).map(function (el) {
        return { el: el, cards: Array.from(el.querySelectorAll('.card')), cols: null };
    });

    // Keterangan di overlay (diambil dari alt gambar) + jeda animasi berurutan
    galleries.forEach(function (g) {
        g.cards.forEach(function (card, i) {
            card.style.animationDelay = (i * 0.08) + 's';
            const img = card.querySelector('img');
            const title = card.querySelector('.card-overlay h3');
            if (img && title && !title.textContent.trim()) title.textContent = img.alt;
            const no = document.createElement('span');
            no.className = 'card-no';
            no.setAttribute('aria-hidden', 'true');
            no.textContent = String(i + 1).padStart(2, '0');
            card.appendChild(no);
        });
    });

    function columnCount() {
        if (!mq.matches) return 2;                 // HP: 2 kolom
        return window.innerWidth >= 1200 ? 4 : 3;  // tablet: 3 kolom, laptop: 4 kolom
    }

    function build(g, n) {
        if (n === 0) {
            g.el.classList.remove('is-masonry');
            g.el.replaceChildren.apply(g.el, g.cards);
            return;
        }

        const cols = [];
        const heights = [];
        for (let i = 0; i < n; i++) {
            const col = document.createElement('div');
            col.className = 'masonry-col';
            cols.push(col);
            heights.push(0);
        }

        g.cards.forEach(function (card) {
            const img = card.querySelector('img');
            const ratio = img && img.naturalWidth ? img.naturalHeight / img.naturalWidth : 0.75;

            let shortest = 0;
            for (let j = 1; j < n; j++) {
                if (heights[j] < heights[shortest] - 0.001) shortest = j;
            }
            cols[shortest].appendChild(card);
            heights[shortest] += ratio + 0.06;
        });

        g.el.classList.add('is-masonry');
        g.el.replaceChildren.apply(g.el, cols);
    }

    function layout(force) {
        const n = columnCount();
        galleries.forEach(function (g) {
            if (!force && g.cols === n) return;
            g.cols = n;
            build(g, n);
        });
    }

    let resizeTimer;
    function onResize() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () { layout(false); }, 150);
    }

    layout(true);                                           // susunan awal
    window.addEventListener('load', function () { layout(true); }); // susun ulang setelah ukuran foto diketahui
    window.addEventListener('resize', onResize);
})();

// 6. PASTIKAN FUNGSI BISA DIPANGGIL DARI onclick DI HTML
//    Beberapa lingkungan (editor online, bundler, <script type="module">) membungkus
//    kode dalam scope sendiri sehingga fungsi tidak otomatis global. Baris ini
//    membuatnya tetap global tanpa mengubah isi fungsi di atas.
window.toggleTheme = toggleTheme;
window.toggleProfile = toggleProfile;
window.switchTab = switchTab;

// 7. PROTEKSI FOTO: cegah klik kanan, tahan lama (HP), dan drag pada gambar
(function () {
    document.querySelectorAll('img').forEach(function (img) { img.draggable = false; });
    document.addEventListener('contextmenu', function (e) {
        if (e.target.closest && e.target.closest('img, .card, .lightbox, .profile-container')) e.preventDefault();
    });
    document.addEventListener('dragstart', function (e) {
        if (e.target.tagName === 'IMG') e.preventDefault();
    });
})();

// 8. TOMBOL MUSIK: tekan = putar, tekan lagi = mati (ada penanda di tombol & di ikon menu)
(function () {
    const btn = document.getElementById('music-btn');
    const audio = document.getElementById('bg-music');
    if (!btn || !audio) return;
    const label = btn.querySelector('.music-label');
    const dancer = document.getElementById('dancer');
    const vid = dancer ? dancer.querySelector('video') : null;
    let msgTimer;
    let fadeTimer;

    function setPlaying(on) {
        btn.classList.toggle('is-playing', on);
        const root = document.documentElement;
        clearTimeout(fadeTimer);
        if (on) {
            root.classList.remove('music-fading');
            root.classList.add('music-on');
        } else if (root.classList.contains('music-on')) {
            root.classList.add('music-fading'); // efek memudar halus dulu, baru dilepas
            fadeTimer = setTimeout(function () {
                root.classList.remove('music-on', 'music-fading');
                if (vid) { vid.pause(); try { vid.currentTime = 0; } catch (e) {} }
            }, 1100);
        }
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        const t = on ? 'Matikan musik' : 'Putar musik';
        btn.setAttribute('aria-label', t);
        btn.title = t;
        if (label) label.textContent = on ? 'Musik menyala' : 'Musik mati';

        // karakter joget: putar saat musik menyala, berhenti saat mati
        if (vid) {
            if (on) {
                dancer.classList.remove('no-video');
                const p = vid.play();
                if (p && p.catch) p.catch(function () { dancer.classList.add('no-video'); });
            }
        }
    }

    function showMsg(text) {
        if (!label) return;
        label.textContent = text;
        clearTimeout(msgTimer);
        msgTimer = setTimeout(function () { label.textContent = audio.paused ? 'Musik mati' : 'Musik menyala'; }, 2500);
    }

    btn.addEventListener('click', function () {
        if (audio.paused) {
            audio.play().then(function () { setPlaying(true); }).catch(function () {
                setPlaying(false);
                showMsg('File musik tidak ditemukan');
            });
        } else {
            audio.pause();
            audio.currentTime = 0; // mati total, putar lagi mulai dari awal
            setPlaying(false);
        }
    });
    audio.addEventListener('error', function () { setPlaying(false); showMsg('File musik tidak ditemukan'); });
    audio.addEventListener('ended', function () { setPlaying(false); });
})();