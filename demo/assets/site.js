/* Kozalak Bungalov demo: ortak davranışlar ve sayfa modülleri */
(function () {
    'use strict';

    var B = window.KOZALAK.bungalows;
    var page = document.body.getAttribute('data-page');

    // ---------- Yardımcılar ----------
    function $(s, r) { return (r || document).querySelector(s); }
    function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
    function pad2(n) { return (n < 10 ? '0' : '') + n; }
    function pad(n) { return n < 10 ? '0' + n : '' + n; }
    function iso(d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
    function parse(s) {
        var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
        return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
    }
    function addDays(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
    function today() { var n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); }
    function fmt(s) { var d = parse(s); return d ? pad2(d.getDate()) + '.' + pad2(d.getMonth() + 1) + '.' + d.getFullYear() : '-'; }
    function money(n) { return '₺' + n.toLocaleString('tr-TR'); }
    function url(b, n, thumb) { return 'assets/img/' + b.slug + '/' + (thumb ? 'thumb/' : '') + pad(n) + '.jpg'; }
    function find(key) {
        key = (key || '').toLowerCase();
        for (var i = 0; i < B.length; i++) if (B[i].slug === key || B[i].name.toLowerCase() === key) return B[i];
        return null;
    }
    function thumbSize(w, h) { return w >= h ? [640, Math.round(640 * h / w)] : [Math.round(640 * w / h), 640]; }
    function query(name) { return new URLSearchParams(location.search).get(name) || ''; }
    var ICON = {
        pool: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M2 18c1.5 0 1.5 1 3 1s1.5-1 3-1 1.5 1 3 1 1.500-1 3-1 1.500 1 3 1 1.500-1 3-1"/><path d="M2 14c1.500 0 1.500 1 3 1s1.500-1 3-1 1.500 1 3 1 1.500-1 3-1 1.500 1 3 1 1.500-1 3-1"/><path d="M8 11V5a2 2 0 0 1 4 0M14 11V5a2 2 0 0 1 4 0M8 8h6"/></svg>',
        tub: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h18v3a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-3zM6 12V6a2 2 0 0 1 4 0M7 19l-1 2M17 19l1 2"/></svg>',
        fire: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c1 3.500 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 .500 1.500 1 2 2 2 0-3-1-5 1-8z"/></svg>',
        tree: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l5 7h-3l4 6H6l4-6H7l5-7zM12 16v5"/></svg>'
    };

    // ---------- Header, footer, demo şeridi ----------
    function chrome() {
        var hero = document.body.hasAttribute('data-hero');
        var links = [['index.html', 'Ana Sayfa', 'home'], ['bungalows.html', 'Bungalovlar', 'bungalows'], ['gallery.html', 'Galeri', 'gallery'], ['reservation.html', 'Rezervasyon', 'reservation']];
        var nav = links.map(function (l) { return '<a href="' + l[0] + '"' + (page === l[2] ? ' aria-current="page"' : '') + '>' + l[1] + '</a>'; }).join('');
        var header = document.createElement('header');
        header.className = 'site-header' + (hero ? '' : ' is-solid');
        header.id = 'siteHeader';
        header.innerHTML = '<div class="wrap"><a class="brand" href="index.html" aria-label="The Intense Bungalov, ana sayfa"><img src="assets/img/logo.png" alt="" width="52" height="52"><span>The Intense<small>Bungalov</small></span></a>' +
            '<nav class="nav" aria-label="Ana menü">' + nav + '</nav>' +
            '<a class="btn btn-amber nav-cta" href="reservation.html">Rezervasyon Yap</a>' +
            '<button class="burger" id="burger" aria-label="Menüyü aç" aria-expanded="false" aria-controls="mobileNav"><span></span><span></span><span></span></button></div>';
        document.body.insertBefore(header, document.body.firstChild);

        var mobile = document.createElement('div');
        mobile.className = 'mobile-nav'; mobile.id = 'mobileNav';
        mobile.innerHTML = nav + '<a class="btn btn-amber" href="reservation.html">Rezervasyon Yap</a>';
        document.body.insertBefore(mobile, header.nextSibling);

        var burger = $('#burger');
        function setMenu(open) {
            mobile.classList.toggle('open', open);
            burger.setAttribute('aria-expanded', open ? 'true' : 'false');
            burger.setAttribute('aria-label', open ? 'Menüyü kapat' : 'Menüyü aç');
            document.body.classList.toggle('menu-open', open);
        }
        burger.addEventListener('click', function () { setMenu(!mobile.classList.contains('open')); });
        mobile.addEventListener('click', function (e) { if (e.target.tagName === 'A') setMenu(false); });
        document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

        if (hero) {
            var onScroll = function () { header.classList.toggle('is-solid', window.scrollY > 40); };
            onScroll(); window.addEventListener('scroll', onScroll, { passive: true });
        }

        var footer = document.createElement('footer');
        footer.className = 'site-footer';
        footer.innerHTML = '<div class="wrap"><div class="foot-grid"><div><a class="brand" href="index.html"><img src="assets/img/logo.png" alt="" width="52" height="52"><span>The Intense<small>Bungalov</small></span></a>' +
            '<p style="max-width:360px">Doğanın içinde, havuzlu ve jakuzili A-frame bungalovlar. Bu site, Kozalak Bungalov ile hazırlanmış örnek bir işletme sitesidir.</p></div>' +
            '<div><h4>Sayfalar</h4>' + links.map(function (l) { return '<a href="' + l[0] + '">' + l[1] + '</a>'; }).join('') + '</div>' +
            '<div><h4>İletişim</h4><p>Telefon, adres ve harita bilgileri işletmenize göre eklenir.</p><a href="https://wa.me/905340806421?text=' + encodeURIComponent('Merhaba, Kozalak Bungalov hakkında bilgi almak istiyorum.') + '" target="_blank" rel="noopener" style="color:var(--amber)">Kozalak Bungalov\'a yazın</a></div></div>' +
            '<div class="foot-note"><span>&copy; 2026 The Intense Bungalov (örnek site)</span><span>Hazırlayan: <a href="../index.html">Kozalak Bungalov</a></span></div></div>';
        document.body.appendChild(footer);

        var banner = document.createElement('div');
        banner.className = 'demo-banner';
        banner.innerHTML = '<span>🌲 <strong>Kozalak Bungalov</strong> demosu. Girdiğiniz bilgiler yalnızca tarayıcınızda kalır, kimseye gönderilmez.</span>' +
            '<span class="demo-banner-actions"><button type="button" id="demoReset">Örnek verileri sıfırla</button><a href="../index.html#paketler">Paketler ve teklif al</a></span>';
        document.body.appendChild(banner);
        $('#demoReset').addEventListener('click', function () { window.KozalakDemo.reset(); });
    }

    function reveal() {
        var items = $$('.reveal');
        if (!('IntersectionObserver' in window)) { items.forEach(function (e) { e.classList.add('in'); }); return; }
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
        }, { threshold: 0.12 });
        items.forEach(function (e) { io.observe(e); });
    }

    // ---------- Lightbox ve video ----------
    var lb = { list: [], i: 0, el: null };
    function lightbox(list, index) {
        if (!lb.el) {
            lb.el = document.createElement('div');
            lb.el.className = 'lightbox'; lb.el.setAttribute('role', 'dialog'); lb.el.setAttribute('aria-modal', 'true'); lb.el.setAttribute('aria-label', 'Fotoğraf görüntüleyici');
            lb.el.innerHTML = '<button class="lb-close" aria-label="Kapat">✕</button><button class="lb-prev" aria-label="Önceki">‹</button><img alt=""><button class="lb-next" aria-label="Sonraki">›</button><div class="lb-cap"></div>';
            document.body.appendChild(lb.el);
            lb.el.addEventListener('click', function (e) {
                if (e.target === lb.el || e.target.classList.contains('lb-close')) closeLb();
                else if (e.target.classList.contains('lb-prev')) show(lb.i - 1);
                else if (e.target.classList.contains('lb-next')) show(lb.i + 1);
            });
            document.addEventListener('keydown', function (e) {
                if (!lb.el.classList.contains('open')) return;
                if (e.key === 'Escape') closeLb(); else if (e.key === 'ArrowLeft') show(lb.i - 1); else if (e.key === 'ArrowRight') show(lb.i + 1);
            });
            var x0 = null;
            lb.el.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
            lb.el.addEventListener('touchend', function (e) {
                if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; x0 = null;
                if (Math.abs(dx) > 50) show(lb.i + (dx < 0 ? 1 : -1));
            });
        }
        lb.list = list; show(index); lb.el.classList.add('open'); document.body.style.overflow = 'hidden'; $('.lb-close', lb.el).focus();
    }
    function show(i) {
        lb.i = (i + lb.list.length) % lb.list.length;
        var it = lb.list[lb.i];
        $('img', lb.el).src = it.src; $('img', lb.el).alt = it.cap;
        $('.lb-cap', lb.el).textContent = it.cap + '  ·  ' + (lb.i + 1) + ' / ' + lb.list.length;
    }
    function closeLb() { lb.el.classList.remove('open'); document.body.style.overflow = ''; }

    function openVideo(src, poster) {
        var m = document.createElement('div');
        m.className = 'lightbox video-modal open'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true'); m.setAttribute('aria-label', 'Tanıtım videosu');
        m.innerHTML = '<button class="lb-close" aria-label="Kapat">✕</button><video controls autoplay playsinline poster="' + poster + '"><source src="' + src + '" type="video/mp4"></video>';
        document.body.appendChild(m); document.body.style.overflow = 'hidden';
        function close() { m.remove(); document.body.style.overflow = ''; document.removeEventListener('keydown', onKey); }
        function onKey(e) { if (e.key === 'Escape') close(); }
        m.addEventListener('click', function (e) { if (e.target === m || e.target.classList.contains('lb-close')) close(); });
        document.addEventListener('keydown', onKey);
        $('.lb-close', m).focus();
    }

    // ---------- Ana sayfa ----------
    function home() {
        $('#homeCards').innerHTML = B.map(function (b) {
            return '<a class="b-card reveal" href="bungalows.html#' + b.slug + '"><div class="ph"><img src="' + url(b, b.cover, true) + '" alt="' + b.name + ' bungalovu" loading="lazy" style="object-position:' + b.pos + '"></div>' +
                '<div class="body"><h3>' + b.name + '</h3><p class="tag">' + b.tagline + '</p><div class="chips"><span class="chip">' + b.capacity + '</span><span class="chip">' + b.rooms + '</span><span class="chip">' + b.area + '</span></div>' +
                '<div class="foot"><span class="price">' + money(b.price) + ' <small>/ gece</small></span><span class="arrow-link">İncele →</span></div></div></a>';
        }).join('');

        var picks = [['akasya', 16], ['zeytin', 2], ['mese', 6], ['palmiye', 8], ['ihlamur', 14], ['zeytin', 14]];
        $('#homeMosaic').innerHTML = picks.map(function (p) {
            var b = find(p[0]);
            return '<a href="gallery.html?b=' + b.slug + '" class="reveal"><img src="' + url(b, p[1], true) + '" alt="' + b.name + ' bungalovundan bir görünüm" loading="lazy"></a>';
        }).join('');

        var sel = $('#bfBungalow');
        sel.innerHTML = '<option value="">Tümü</option>' + B.map(function (b) { return '<option value="' + b.slug + '">' + b.name + '</option>'; }).join('');
        var inEl = $('#bfIn'), outEl = $('#bfOut'), t = iso(today());
        inEl.min = t; outEl.min = iso(addDays(today(), 1));
        inEl.addEventListener('change', function () {
            if (!inEl.value) return;
            var next = iso(addDays(parse(inEl.value), 1));
            outEl.min = next; if (!outEl.value || outEl.value < next) outEl.value = next;
        });
        $('#bookingForm').addEventListener('submit', function (e) {
            e.preventDefault();
            var q = [];
            if (inEl.value) q.push('checkIn=' + encodeURIComponent(inEl.value));
            if (outEl.value) q.push('checkOut=' + encodeURIComponent(outEl.value));
            if (sel.value) q.push('bungalow=' + encodeURIComponent(sel.value));
            location.href = 'reservation.html' + (q.length ? '?' + q.join('&') : '');
        });

        $('#tourBtn').addEventListener('click', function () { openVideo('assets/video/tour.mp4', 'assets/video/poster.jpg'); });
        $$('.perk .ico').forEach(function (el) { el.innerHTML = ICON[el.getAttribute('data-ico')] || ''; });
    }

    // ---------- Bungalovlar ----------
    function bungalows() {
        $('#bungalowList').innerHTML = B.map(function (b) {
            return '<article class="b-detail" id="' + b.slug + '" data-slug="' + b.slug + '">' +
                '<div class="viewer"><div class="main"><img alt="' + b.name + ' fotoğrafı" width="1200" height="900"><button class="nav-btn prev" aria-label="Önceki fotoğraf">‹</button><button class="nav-btn next" aria-label="Sonraki fotoğraf">›</button><span class="count"></span></div><div class="thumbs" role="group" aria-label="' + b.name + ' fotoğrafları"></div></div>' +
                '<div class="b-info"><span class="eyebrow">' + b.tagline + '</span><h2>' + b.name + '</h2><p class="tag">' + b.capacity + ' · ' + b.area + '</p><p>' + b.desc + '</p>' +
                '<div class="specs"><div><b>Kapasite</b>' + b.capacity + '</div><div><b>Yatak odası</b>' + b.rooms + '</div><div><b>Banyo</b>' + b.baths + '</div><div><b>Alan</b>' + b.area + '</div></div>' +
                '<div class="chips">' + b.features.map(function (f) { return '<span class="chip">' + f + '</span>'; }).join('') + '</div>' +
                '<div class="buy"><span class="price">' + money(b.price) + ' <small>/ gece (örnek fiyat)</small></span><a class="btn btn-teal" href="reservation.html?bungalow=' + b.slug + '">Rezervasyon Yap</a><a class="btn btn-outline" href="gallery.html?b=' + b.slug + '">Tüm fotoğraflar</a></div></div></article>';
        }).join('');

        $$('.b-detail').forEach(function (sec) {
            var b = find(sec.getAttribute('data-slug')), idx = 0;
            var mainImg = $('.main img', sec), count = $('.count', sec), thumbs = $('.thumbs', sec);
            thumbs.innerHTML = b.images.map(function (im, k) {
                return '<button type="button" data-k="' + k + '" aria-label="Fotoğraf ' + (k + 1) + '"><img src="' + url(b, im[0], true) + '" alt="" loading="lazy"></button>';
            }).join('');
            function set(k) {
                idx = (k + b.images.length) % b.images.length;
                var im = b.images[idx];
                mainImg.src = url(b, im[0]); mainImg.width = im[1]; mainImg.height = im[2];
                mainImg.classList.toggle('tall', im[2] > im[1] * 1.05);
                $('.main', sec).style.setProperty('--bg', 'url(' + url(b, im[0], true) + ')');
                count.textContent = (idx + 1) + ' / ' + b.images.length;
                $$('button', thumbs).forEach(function (btn, j) { btn.setAttribute('aria-current', j === idx ? 'true' : 'false'); });
                var active = thumbs.children[idx]; if (active) thumbs.scrollTo({ left: active.offsetLeft - 80, behavior: 'smooth' });
            }
            $('.prev', sec).addEventListener('click', function () { set(idx - 1); });
            $('.next', sec).addEventListener('click', function () { set(idx + 1); });
            thumbs.addEventListener('click', function (e) { var btn = e.target.closest('button'); if (btn) set(+btn.getAttribute('data-k')); });
            mainImg.addEventListener('click', function () {
                lightbox(b.images.map(function (im) { return { src: url(b, im[0]), cap: b.name }; }), idx);
            });
            set(0);
        });
        if (location.hash) { var t = document.getElementById(location.hash.slice(1)); if (t) setTimeout(function () { t.scrollIntoView(); }, 50); }
    }

    // ---------- Galeri ----------
    function gallery() {
        var all = [], max = Math.max.apply(null, B.map(function (b) { return b.images.length; }));
        for (var k = 0; k < max; k++) B.forEach(function (b) { if (b.images[k]) all.push({ b: b, im: b.images[k] }); });  // bungalovları karıştırarak sırala
        var filter = find(query('b')) ? find(query('b')).slug : 'all';
        var filters = $('#filters'), grid = $('#masonry');
        filters.innerHTML = '<button type="button" data-f="all">Tümü <small>(' + all.length + ')</small></button>' + B.map(function (b) {
            return '<button type="button" data-f="' + b.slug + '">' + b.name + ' <small>(' + b.images.length + ')</small></button>';
        }).join('');
        var current = [];
        function render() {
            current = all.filter(function (x) { return filter === 'all' || x.b.slug === filter; });
            grid.innerHTML = current.map(function (x, i) {
                var s = thumbSize(x.im[1], x.im[2]);
                return '<button type="button" data-i="' + i + '" aria-label="' + x.b.name + ' fotoğrafını büyüt"><img src="' + url(x.b, x.im[0], true) + '" width="' + s[0] + '" height="' + s[1] + '" alt="' + x.b.name + ' bungalovundan bir görünüm" loading="lazy" decoding="async"><span class="lbl">' + x.b.name + '</span></button>';
            }).join('');
            $$('button', filters).forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-f') === filter ? 'true' : 'false'); });
        }
        filters.addEventListener('click', function (e) {
            var btn = e.target.closest('button'); if (!btn) return;
            filter = btn.getAttribute('data-f'); render();
            history.replaceState(null, '', filter === 'all' ? 'gallery.html' : 'gallery.html?b=' + filter);
        });
        grid.addEventListener('click', function (e) {
            var btn = e.target.closest('button'); if (!btn) return;
            lightbox(current.map(function (x) { return { src: url(x.b, x.im[0]), cap: x.b.name }; }), +btn.getAttribute('data-i'));
        });
        render();
    }

    // ---------- Rezervasyon ----------
    function reservation() {
        var state = { b: null, inD: '', outD: '', booked: {}, view: new Date(today().getFullYear(), today().getMonth(), 1) };
        var months = $('#calMonths'), hint = $('#calHint'), formMsg = $('#formMsg');
        var minMonth = new Date(today().getFullYear(), today().getMonth(), 1);

        $('#bungPick').innerHTML = B.map(function (b) {
            return '<label><input type="radio" name="bungalow" value="' + b.slug + '"><span class="opt"><img src="' + url(b, b.cover, true) + '" alt="" loading="lazy" style="object-position:' + b.pos + '"><div>' + b.name + '<small>' + b.capacity + ' · ' + money(b.price) + '</small></div></span></label>';
        }).join('');

        function nights() { return state.inD && state.outD ? Math.round((parse(state.outD) - parse(state.inD)) / 86400000) : 0; }
        function rangeHasBooked(from, to) {
            for (var d = parse(from); d < parse(to); d = addDays(d, 1)) if (state.booked[iso(d)]) return true;
            return false;
        }

        function drawMonth(first) {
            var y = first.getFullYear(), m = first.getMonth(), t = iso(today());
            var lead = (first.getDay() + 6) % 7, days = new Date(y, m + 1, 0).getDate();
            var h = '<div><div class="cal-title">' + first.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }) + '</div><div class="cal-grid">';
            ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'].forEach(function (w) { h += '<div class="wd">' + w + '</div>'; });
            for (var i = 0; i < lead; i++) h += '<span></span>';
            for (var d = 1; d <= days; d++) {
                var s = y + '-' + pad2(m + 1) + '-' + pad2(d), c = 'd';
                if (s < t) c += ' off';
                else if (state.booked[s]) c += ' booked';
                if (s === t) c += ' today';
                if (state.inD && state.outD && s > state.inD && s < state.outD) c += ' range';
                if (s === state.inD) c += ' sel start' + (state.outD ? '' : ' end');
                if (s === state.outD) c += ' sel end';
                h += '<button type="button" class="' + c + '" data-d="' + s + '"' + (s < t ? ' disabled' : '') + ' aria-label="' + d + ' ' + first.toLocaleDateString('tr-TR', { month: 'long' }) + '">' + d + '</button>';
            }
            return h + '</div></div>';
        }
        function drawCal() {
            months.innerHTML = drawMonth(state.view) + drawMonth(new Date(state.view.getFullYear(), state.view.getMonth() + 1, 1));
            $('#calPrev').disabled = state.view <= minMonth;
            hint.textContent = !state.b ? 'Önce bir bungalov seçin; dolu geceler takvimde işaretlenir.' : !state.inD ? 'Giriş tarihinizi seçin.' : !state.outD ? 'Şimdi çıkış tarihinizi seçin.' : '';
            updateSummary();
        }
        function updateSummary() {
            var b = state.b, n = nights();
            $('#sumName').textContent = b ? b.name : 'Bungalov seçilmedi';
            $('#sumTag').textContent = b ? b.tagline : 'Soldan bir bungalov seçin';
            $('#sumPhoto').src = b ? url(b, b.cover, true) : 'assets/video/poster.jpg';
            $('#sumPhoto').style.objectPosition = b ? b.pos : '50% 50%';
            $('#sumIn').textContent = fmt(state.inD); $('#sumOut').textContent = fmt(state.outD);
            $('#sumNights').textContent = n ? n + ' gece' : '-';
            $('#sumGuests').textContent = ($('#guests').value || '-') + ' kişi';
            $('#sumTotal').textContent = b && n ? money(b.price * n) : '-';
        }

        months.addEventListener('click', function (e) {
            var btn = e.target.closest('button.d'); if (!btn) return;
            var s = btn.getAttribute('data-d'); formMsg.className = 'msg';
            if (!state.b) { hint.textContent = 'Önce bir bungalov seçin.'; return; }
            if (!state.inD || state.outD) {
                if (state.booked[s]) return;
                state.inD = s; state.outD = '';
            } else if (s <= state.inD) {
                if (state.booked[s]) return;
                state.inD = s;
            } else if (rangeHasBooked(state.inD, s)) {
                hint.textContent = 'Bu aralıkta dolu geceler var. Başka bir çıkış tarihi ya da giriş tarihi seçin.';
                return;
            } else {
                state.outD = s;
            }
            drawCal();
        });
        $('#calPrev').addEventListener('click', function () { state.view = new Date(state.view.getFullYear(), state.view.getMonth() - 1, 1); drawCal(); });
        $('#calNext').addEventListener('click', function () { state.view = new Date(state.view.getFullYear(), state.view.getMonth() + 1, 1); drawCal(); });

        function chooseBungalow(b) {
            state.b = b; state.booked = {};
            fetch('/api/booked-dates?bungalow=' + encodeURIComponent(b.name)).then(function (r) { return r.json(); }).then(function (data) {
                (data.booked_dates || []).forEach(function (d) { state.booked[d] = true; });
                if (state.inD && state.outD && rangeHasBooked(state.inD, state.outD)) { state.outD = ''; }
                if (state.inD && state.booked[state.inD]) state.inD = '';
                drawCal();
            }).catch(function () { drawCal(); });
        }
        $('#bungPick').addEventListener('change', function (e) {
            if (e.target.name === 'bungalow') chooseBungalow(find(e.target.value));
        });
        $('#guests').addEventListener('input', updateSummary);

        // Ana sayfadaki arama çubuğundan gelen seçimler
        var pre = find(query('bungalow'));
        if (pre) { $('input[value="' + pre.slug + '"]', $('#bungPick')).checked = true; chooseBungalow(pre); }
        var qi = parse(query('checkIn')), qo = parse(query('checkOut'));
        if (qi && qi >= today()) {
            state.inD = iso(qi); state.view = new Date(qi.getFullYear(), qi.getMonth(), 1);
            if (qo && qo > qi) state.outD = iso(qo);
        }
        drawCal();

        $('#resForm').addEventListener('submit', function (e) {
            e.preventDefault();
            function fail(t) { formMsg.className = 'msg err'; formMsg.textContent = t; formMsg.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
            if (!state.b) return fail('Lütfen bir bungalov seçin.');
            if (!state.inD || !state.outD) return fail('Lütfen giriş ve çıkış tarihlerini takvimden seçin.');
            var btn = $('#submitBtn'); btn.disabled = true; btn.textContent = 'Gönderiliyor...';
            fetch('/api/reservation', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: $('#name').value, email: $('#email').value, phone: $('#phone').value, guests: $('#guests').value, bungalow: state.b.name, checkIn: state.inD, checkOut: state.outD, notes: $('#notes').value })
            }).then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); }).then(function (res) {
                btn.disabled = false; btn.textContent = 'Rezervasyon talebi gönder';
                if (!res.ok) return fail(res.d.message || 'Bir hata oluştu.');
                $('#resFlow').style.display = 'none'; $('#success').style.display = 'block'; $('#success').scrollIntoView({ behavior: 'smooth', block: 'center' });
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }).catch(function () { btn.disabled = false; btn.textContent = 'Rezervasyon talebi gönder'; fail('Bir hata oluştu, lütfen tekrar deneyin.'); });
        });
    }

    // ---------- Başlat ----------
    chrome();
    if (page === 'home') home();
    else if (page === 'bungalows') bungalows();
    else if (page === 'gallery') gallery();
    else if (page === 'reservation') reservation();
    reveal();
})();
