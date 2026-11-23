// =====================================================================
// lou.js — logika bersama untuk hio.html, index.html, cerita/cerita.html
// Semua fitur lama tetap ada; fungsi yang dipanggil dari onclick tetap global.
// =====================================================================
(function () { document.documentElement.classList.add('js'); })();

const REDUCE_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// MODE RINGAN: otomatis aktif di HP / layar sentuh / perangkat spek rendah.
// Efek berat saat musik menyala (animasi latar, not melayang, video, dll) dimatikan.
const LITE_FORCE = true;             // true = selalu ringan (default sekarang), null = otomatis, false = efek penuh
const DANCER_ON_LITE = true;        // video joget tampil (kecil & polos); false = dimatikan
const LITE = (LITE_FORCE !== null) ? LITE_FORCE : (
    window.matchMedia('(max-width: 768px)').matches ||
    window.matchMedia('(pointer: coarse)').matches ||
    (navigator.deviceMemory && navigator.deviceMemory <= 4) ||
    (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4)
);
if (LITE) document.documentElement.classList.add('lite');
const store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
};

// 1. LOGIKA GANTI TEMA (LIGHT/DARK MODE) — tersimpan & ikut ke semua halaman
function syncThemeLabel() {
    const isDark = document.documentElement.classList.contains('dark');
    document.querySelectorAll('.theme-btn').forEach(function (b) {
        const t = isDark ? 'Ganti ke mode siang' : 'Ganti ke mode malam';
        b.setAttribute('aria-label', t);
        b.title = t;
    });
}
function toggleTheme() {
    const apply = function () {
        const isDark = document.documentElement.classList.toggle('dark');
        store.set('tema', isDark ? 'dark' : 'light');
        syncThemeLabel();
    };
    // Transisi tema yang halus (cross-fade) bila browser mendukung
    if (document.startViewTransition && !REDUCE_MOTION && !LITE) document.startViewTransition(apply);
    else apply();
}
syncThemeLabel();

// ================= LOGIKA LOADING SCREEN =================
(function () {
    let finished = false;
    function finish() {
        if (finished) return;
        finished = true;
        const ls = document.getElementById('loading-screen');
        if (ls) {
            ls.classList.add('is-done');
            setTimeout(function () { ls.style.display = 'none'; }, 850);
        }
        document.documentElement.classList.add('is-ready');
        window.dispatchEvent(new Event('lou:ready'));
        // Setelah animasi masuk selesai, kunci tampilannya agar efek musik tidak membuatnya hilang
        setTimeout(function () {
            document.querySelectorAll('.fade-in-up').forEach(function (el) { el.classList.add('is-shown'); });
        }, 1900);
    }
    let seen = false;
    try { seen = sessionStorage.getItem('lou_seen') === '1'; sessionStorage.setItem('lou_seen', '1'); } catch (e) {}
    const wait = seen ? 150 : 600; // kunjungan berikutnya lebih singkat
    window.addEventListener('load', function () { setTimeout(finish, wait); });
    setTimeout(finish, 4500); // jaga-jaga bila ada gambar yang lambat
})();

// 2. LOGIKA GANTI FOTO PROFIL
const profilePhotos = [
    "profil/1.jpeg", // Foto 1
    "profil/2.jpeg"  // Foto 2
];
let profileIndex = 0;
let profileBusy = false;

(function () {
    const img = document.getElementById('profileImg');
    if (!img) return;
    img.addEventListener('error', function () { img.classList.add('is-broken'); });
    img.addEventListener('load', function () { img.classList.remove('is-broken'); });
    if (img.complete && img.naturalWidth === 0) img.classList.add('is-broken');
})();

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
    const img = document.getElementById('profileImg');
    if (!img || profileBusy) return; // cegah klik beruntun saat transisi
    profileBusy = true;
    burstStars(document.querySelector('.profile-container, .profile-photo'));

    profileIndex = (profileIndex + 1) % profilePhotos.length;

    // Muat foto berikutnya dulu supaya pergantiannya mulus
    const next = new Image();
    next.src = profilePhotos[profileIndex];

    img.classList.add('fade-out');
    setTimeout(function () {
        img.src = profilePhotos[profileIndex];
        img.classList.remove('fade-out');
        profileBusy = false;
    }, 350);
}

// 3. REVEAL KARTU GALERI SAAT MUNCUL DI LAYAR (halus & berurutan)
const cardReveal = (function () {
    const io = ('IntersectionObserver' in window) ? new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
            if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
        });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 }) : null;

    return function (cards, restart) {
        cards.forEach(function (c, i) {
            c.style.setProperty('--d', ((i % 4) * 90) + 'ms');
            if (restart) c.classList.remove('is-in');
        });
        if (restart) void document.body.offsetHeight; // paksa reflow agar transisi diputar ulang
        cards.forEach(function (c) {
            if (!io) { c.classList.add('is-in'); return; }
            if (!c.classList.contains('is-in')) io.observe(c);
        });
    };
})();

// 4. LOGIKA PINDAH TAB GALERI
function switchTab(tabName) {
    const btnDesign = document.getElementById('btn-design');
    const btnPhoto = document.getElementById('btn-photo');
    const galleryDesign = document.getElementById('gallery-design');
    const galleryPhoto = document.getElementById('gallery-photo');

    if (!btnDesign || !btnPhoto || !galleryDesign || !galleryPhoto) return; // halaman ini tidak punya kedua tab

    const isDesign = tabName === 'design';

    btnDesign.classList.toggle('active-tab', isDesign);
    btnPhoto.classList.toggle('active-tab', !isDesign);
    btnDesign.setAttribute('aria-selected', isDesign ? 'true' : 'false');
    btnPhoto.setAttribute('aria-selected', isDesign ? 'false' : 'true');
    const nav = btnDesign.closest('.gallery-nav');
    if (nav) nav.setAttribute('data-active', isDesign ? 'design' : 'photo');

    galleryDesign.classList.toggle('gallery-visible', isDesign);
    galleryDesign.classList.toggle('gallery-hidden', !isDesign);
    galleryPhoto.classList.toggle('gallery-visible', !isDesign);
    galleryPhoto.classList.toggle('gallery-hidden', isDesign);

    const shown = isDesign ? galleryDesign : galleryPhoto;
    cardReveal(Array.from(shown.querySelectorAll('.card')), true);
}

// 5. LIGHTBOX: klik / ketuk 2 kali pada foto atau desain untuk full screen
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

// 6. GALERI MASONRY (laptop/tablet): foto tampil utuh, disusun ke kolom terpendek
//    Di HP memakai 2 kolom.
(function () {
    const mq = window.matchMedia('(min-width: 769px)');

    const galleries = Array.from(document.querySelectorAll('.gallery-container')).map(function (el) {
        return { el: el, cards: Array.from(el.querySelectorAll('.card')), cols: null };
    });
    if (!galleries.length) return;

    // Keterangan di overlay (diambil dari alt gambar) + nomor urut
    galleries.forEach(function (g) {
        g.cards.forEach(function (card, i) {
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

    layout(true);                                                   // susunan awal
    // Foto dimuat bertahap (lazy): susun ulang pelan-pelan setelah ukuran foto diketahui
    let imgTimer;
    galleries.forEach(function (g) {
        g.cards.forEach(function (c) {
            const im = c.querySelector('img');
            if (im && !im.complete) im.addEventListener('load', function () {
                clearTimeout(imgTimer);
                imgTimer = setTimeout(function () { layout(true); }, 400);
            }, { once: true });
        });
    });
    window.addEventListener('load', function () { layout(true); }); // susun ulang setelah ukuran foto diketahui
    window.addEventListener('resize', onResize);

    // Kartu muncul berurutan; hanya galeri yang sedang tampil
    const visible = galleries.filter(function (g) { return g.el.classList.contains('gallery-visible'); });
    visible.forEach(function (g) { cardReveal(g.cards, false); });
    galleries.forEach(function (g) {
        if (visible.indexOf(g) === -1) g.cards.forEach(function (c, i) { c.style.setProperty('--d', ((i % 4) * 90) + 'ms'); });
    });
})();

// 7. FUNGSI HARUS BISA DIPANGGIL DARI onclick DI HTML
window.toggleTheme = toggleTheme;
window.toggleProfile = toggleProfile;
window.switchTab = switchTab;

// 8. PROTEKSI FOTO: cegah klik kanan, tahan lama (HP), dan drag pada gambar
(function () {
    document.querySelectorAll('img').forEach(function (img) { img.draggable = false; });
    document.addEventListener('contextmenu', function (e) {
        if (e.target.closest && e.target.closest('img, .card, .lightbox, .profile-container, .profile-photo')) e.preventDefault();
    });
    document.addEventListener('dragstart', function (e) {
        if (e.target.tagName === 'IMG') e.preventDefault();
    });
})();

// 9. NAVIGASI: sembunyi saat scroll turun, menu HP, transisi antar halaman
(function () {
    const root = document.documentElement;
    const bar = document.querySelector('.topbar');
    const menuBtn = document.getElementById('menu-btn');

    function setMenu(open) {
        root.classList.toggle('menu-open', open);
        if (menuBtn) {
            menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
            menuBtn.setAttribute('aria-label', open ? 'Tutup menu' : 'Buka menu');
        }
        if (window.louLenis) { open ? window.louLenis.stop() : window.louLenis.start(); }
        else document.body.style.overflow = open ? 'hidden' : '';
        if (open && bar) bar.classList.remove('is-hidden');
    }
    if (menuBtn) menuBtn.addEventListener('click', function () { setMenu(!root.classList.contains('menu-open')); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && root.classList.contains('menu-open')) setMenu(false); });
    window.addEventListener('resize', function () { if (window.innerWidth >= 768 && root.classList.contains('menu-open')) setMenu(false); });

    // Bar menghilang saat scroll turun, muncul saat scroll naik
    if (bar) {
        let lastY = window.scrollY, ticking = false;
        window.addEventListener('scroll', function () {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(function () {
                const y = window.scrollY;
                const down = y > lastY + 4, up = y < lastY - 4;
                if (y < 80 || up) bar.classList.remove('is-hidden');
                else if (down && !root.classList.contains('menu-open')) bar.classList.add('is-hidden');
                if (down || up) lastY = y;
                ticking = false;
            });
        }, { passive: true });
    }

    // Transisi pindah halaman: memudar dulu, lalu pindah
    document.addEventListener('click', function (e) {
        const a = e.target.closest && e.target.closest('a[href]');
        if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        if (a.target && a.target !== '_self') return;
        if (a.hasAttribute('download')) return;
        let url;
        try { url = new URL(a.href, location.href); } catch (err) { return; }
        if (url.protocol !== location.protocol || url.host !== location.host) return;

        const samePage = url.pathname === location.pathname;
        if (samePage && url.hash) {                       // anchor di halaman yang sama
            const target = document.querySelector(url.hash);
            if (target && window.louLenis) { e.preventDefault(); setMenu(false); window.louLenis.scrollTo(target); }
            else if (root.classList.contains('menu-open')) setMenu(false);
            return;
        }
        if (samePage) return;
        e.preventDefault();
        root.classList.add('page-leaving');
        setTimeout(function () { location.href = a.href; }, REDUCE_MOTION ? 0 : 380);
    });
    window.addEventListener('pageshow', function (e) {
        if (e.persisted) { root.classList.remove('page-leaving'); setMenu(false); }
    });
})();

// 10. TOMBOL MUSIK: tekan = putar, tekan lagi = mati. Status ikut ke halaman lain.
(function () {
    const btn = document.getElementById('music-btn');
    const audio = document.getElementById('bg-music');
    if (!btn || !audio) return;
    const label = btn.querySelector('.music-label');
    const dancer = document.getElementById('dancer');
    const vid = dancer ? dancer.querySelector('video') : null;
    const root = document.documentElement;
    let msgTimer, fadeTimer, noteTimer;

    function toast(text) {
        let t = document.getElementById('lou-toast');
        if (!t) {
            t = document.createElement('div');
            t.id = 'lou-toast';
            t.setAttribute('role', 'status');
            document.body.appendChild(t);
        }
        t.textContent = text;
        t.classList.add('is-show');
        clearTimeout(t._h);
        t._h = setTimeout(function () { t.classList.remove('is-show'); }, 2800);
    }

    // Not musik beterbangan saat musik menyala
    function spawnNote() {
        if (document.hidden || document.querySelectorAll('.note').length > 6) return;
        const n = document.createElement('span');
        n.className = 'note';
        n.setAttribute('aria-hidden', 'true');
        n.textContent = ['\u266A', '\u266B', '\u266C', '\u2669'][Math.floor(Math.random() * 4)];
        n.style.left = (Math.random() * 92 + 4) + 'vw';
        n.style.fontSize = (16 + Math.random() * 20) + 'px';
        n.style.setProperty('--h', Math.floor(Math.random() * 360));
        n.style.setProperty('--sway', (Math.random() * 90 - 45) + 'px');
        n.style.animationDuration = (3.8 + Math.random() * 2.4) + 's';
        document.body.appendChild(n);
        n.addEventListener('animationend', function () { n.remove(); });
    }
    function startNotes() { if (!REDUCE_MOTION && !LITE && !noteTimer) noteTimer = setInterval(spawnNote, 900); }
    function stopNotes() { clearInterval(noteTimer); noteTimer = null; }

    function setPlaying(on) {
        btn.classList.toggle('is-playing', on);
        clearTimeout(fadeTimer);
        if (on) {
            root.classList.remove('music-fading');
            root.classList.add('music-text');
            startNotes();
        } else if (root.classList.contains('music-text')) {
            root.classList.add('music-fading'); // efek memudar halus dulu, baru dilepas
            stopNotes();
            fadeTimer = setTimeout(function () {
                root.classList.remove('music-text', 'music-fading');
                if (vid) { vid.pause(); try { vid.currentTime = 0; } catch (e) {} }
            }, 1100);
        }
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        const t = on ? 'Matikan musik' : 'Putar musik';
        btn.setAttribute('aria-label', t);
        btn.title = t;
        if (label) label.textContent = on ? 'Musik menyala' : 'Musik mati';

        // karakter joget: putar saat musik menyala, berhenti saat mati
        if (vid && on && LITE && !DANCER_ON_LITE) {
            dancer.classList.add('no-video'); // mode ringan: video tidak diputar
        } else if (vid && on) {
            dancer.classList.remove('no-video');
            const p = vid.play();
            if (p && p.catch) p.catch(function () { dancer.classList.add('no-video'); });
        }
    }

    function showMsg(text) {
        toast(text);
        if (!label) return;
        label.textContent = text;
        clearTimeout(msgTimer);
        msgTimer = setTimeout(function () { label.textContent = audio.paused ? 'Musik mati' : 'Musik menyala'; }, 2500);
    }

    btn.addEventListener('click', function () {
        if (audio.paused) {
            audio.play().then(function () {
                setPlaying(true);
                store.set('musik', 'on');
            }).catch(function () {
                setPlaying(false);
                showMsg('File musik tidak ditemukan');
            });
        } else {
            audio.pause();
            audio.currentTime = 0; // mati total, putar lagi mulai dari awal
            setPlaying(false);
            store.set('musik', 'off');
            store.set('musik_t', '0');
        }
    });
    audio.addEventListener('error', function () { setPlaying(false); showMsg('File musik tidak ditemukan'); });
    audio.addEventListener('ended', function () { setPlaying(false); store.set('musik', 'off'); });
    // Hemat CPU/baterai: video berhenti saat tab disembunyikan
    document.addEventListener('visibilitychange', function () {
        if (!vid || !root.classList.contains('music-text')) return;
        if (document.hidden) vid.pause();
        else if (!audio.paused && !dancer.classList.contains('no-video')) { const p = vid.play(); if (p && p.catch) p.catch(function () {}); }
    });

    // Musik TIDAK dilanjutkan di halaman lain (supaya tidak lag): berhenti saat pindah halaman.
    store.set('musik', 'off');
    store.set('musik_t', '0');
    window.addEventListener('pagehide', function () {
        try { audio.pause(); } catch (e) {}
        store.set('musik', 'off');
    });
    // Kembali lewat tombol Back (halaman dari cache): pastikan tampilan musik mati
    window.addEventListener('pageshow', function (e) {
        if (!e.persisted) return;
        audio.pause();
        try { audio.currentTime = 0; } catch (err) {}
        setPlaying(false);
    });
})();