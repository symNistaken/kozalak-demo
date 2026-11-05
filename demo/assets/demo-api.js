/*
 * Kozalak Bungalov - sunucusuz demo katmanı.
 *
 * Gerçek üründe bu istekleri Flask sunucusu karşılar. Bu demoda aynı adreslere yapılan
 * fetch çağrıları tarayıcıda yakalanır ve veriler yalnızca ziyaretçinin kendi
 * tarayıcısında (localStorage) tutulur. Hiçbir bilgi bir sunucuya gönderilmez.
 */
(function () {
    'use strict';

    var KEY = 'kozalak_demo_reservations_v1';
    var SEEDED = 'kozalak_demo_seeded_v1';
    var ADMIN = 'kozalak_demo_admin_v1';
    var DEMO_USER = 'admin';
    var DEMO_PASS = 'demo1234';
    var BUNGALOWS = ['Akasya', 'Ihlamur', 'Meşe', 'Palmiye', 'Zeytin'];

    // ---- Depolama (tarayıcı engellerse bellekte tutar) ----
    var memory = { local: {}, session: {} };
    function get(area, k) {
        try { return window[area + 'Storage'].getItem(k); } catch (e) { return memory[area][k] || null; }
    }
    function set(area, k, v) {
        try { window[area + 'Storage'].setItem(k, v); } catch (e) { memory[area][k] = v; }
    }
    function del(area, k) {
        try { window[area + 'Storage'].removeItem(k); } catch (e) { delete memory[area][k]; }
    }

    // ---- Tarih yardımcıları (hepsi yerel saat, YYYY-MM-DD) ----
    function pad(n) { return (n < 10 ? '0' : '') + n; }
    function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
    function parse(s) {
        var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
        if (!m) return null;
        var d = new Date(+m[1], +m[2] - 1, +m[3]);
        return iso(d) === s ? d : null;
    }
    function addDays(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
    function todayDate() { var n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); }
    function uuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0;
            return (c === 'x' ? r : (r & 3 | 8)).toString(16);
        });
    }

    // ---- Veri ----
    function load() {
        try { return JSON.parse(get('local', KEY) || '[]'); } catch (e) { return []; }
    }
    function save(list) { set('local', KEY, JSON.stringify(list)); }

    function seed() {
        var seeded = get('local', SEEDED), fresh = load().length > 0;
        // Örnek tarihler bugüne göre üretilir; bir haftadan eskiyse yenilenir.
        if (fresh && seeded) {
            var age = (todayDate() - parse(seeded)) / 86400000;
            if (age >= 0 && age < 7) return;
        }
        var today = todayDate(), nowIso = new Date().toISOString();
        var samples = [
            ['Ayşe Demir', BUNGALOWS[0], 3, 4, 2, 'approved'],
            ['Mehmet Kaya', BUNGALOWS[1], 6, 3, 4, 'approved'],
            ['Elif Yıldız', BUNGALOWS[2], 10, 5, 3, 'approved'],
            ['Can Arslan', BUNGALOWS[0], 12, 2, 2, 'pending'],
            ['Zeynep Çelik', BUNGALOWS[3], 8, 3, 5, 'pending']
        ];
        save(samples.map(function (s) {
            var checkIn = addDays(today, s[2]);
            return {
                id: uuid(), name: s[0], email: 'ornek@example.com', phone: '05301234567',
                checkIn: iso(checkIn), checkOut: iso(addDays(checkIn, s[3])), guests: s[4],
                bungalow: s[1], notes: 'Örnek demo kaydı', status: s[5], timestamp: nowIso,
                approved_date: s[5] === 'approved' ? nowIso : null, rejected_date: null
            };
        }));
        set('local', SEEDED, iso(today));
    }

    function newestFirst(list) {
        return list.slice().sort(function (a, b) { return a.timestamp < b.timestamp ? 1 : -1; });
    }
    function overlaps(a, b) { return a.checkIn < b.checkOut && a.checkOut > b.checkIn; }
    function conflictsWithApproved(res, list) {
        return list.some(function (r) {
            return r.status === 'approved' && r.id !== res.id && r.bungalow === res.bungalow && overlaps(r, res);
        });
    }
    function eachNight(res, fn) {
        var d = parse(res.checkIn), end = parse(res.checkOut);
        while (d < end) { fn(iso(d)); d = addDays(d, 1); }
    }

    // ---- Doğrulama (sunucudakiyle aynı kurallar) ----
    function validName(s) {
        s = (s || '').trim();
        return s.length >= 2 && s.length <= 100 && /^[a-zA-ZçğıöşüÇĞİÖŞÜ \-']+$/.test(s);
    }
    function validEmail(s) { return typeof s === 'string' && s.length <= 254 && /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(s); }
    function validPhone(s) { return typeof s === 'string' && /^\d{7,15}$/.test(s.replace(/[\s\-()+]/g, '')); }

    // ---- "Sunucu" ----
    function reply(status, body) {
        var response = new Response(JSON.stringify(body), { status: status, headers: { 'Content-Type': 'application/json' } });
        return new Promise(function (resolve) { setTimeout(function () { resolve(response); }, 150); });
    }
    function isAdmin() { return get('session', ADMIN) === '1'; }

    function createReservation(data) {
        if (!data || typeof data !== 'object') return reply(400, { message: 'JSON nesnesi gerekli.' });
        var required = ['name', 'email', 'phone', 'checkIn', 'checkOut', 'guests', 'bungalow'];
        if (!required.every(function (f) { return f in data; })) return reply(400, { message: 'Tüm gerekli alanlar doldurulmalıdır.' });
        if (!validName(data.name)) return reply(400, { message: 'Lütfen geçerli bir ad soyad giriniz (2-100 karakter).' });
        if (!validEmail(data.email)) return reply(400, { message: 'Lütfen geçerli bir e-mail adresi giriniz.' });
        if (!validPhone(data.phone)) return reply(400, { message: 'Lütfen geçerli bir telefon numarası giriniz.' });
        var guests = parseInt(data.guests, 10);
        if (!(guests >= 1 && guests <= 20)) return reply(400, { message: 'Lütfen 1-20 arasında misafir sayısı giriniz.' });
        if (BUNGALOWS.indexOf(data.bungalow) === -1) return reply(400, { message: 'Lütfen geçerli bir bungalov adı seçiniz.' });
        var notes = data.notes == null ? '' : data.notes;
        if (typeof notes !== 'string' || notes.length > 500) return reply(400, { message: 'Notlar 500 karakterden fazla olamaz.' });

        var inD = parse(data.checkIn), outD = parse(data.checkOut), today = todayDate();
        if (!inD || inD < today) return reply(400, { message: 'Giriş tarihi bugünden sonra olmalıdır.' });
        if (!outD || outD < today) return reply(400, { message: 'Çıkış tarihi bugünden sonra olmalıdır.' });
        if (!(outD > inD) || (outD - inD) / 86400000 > 90) {
            return reply(400, { message: 'Çıkış tarihi giriş tarihinden sonra olmalı ve 90 günü aşmamalıdır.' });
        }

        var list = load();
        var res = {
            id: uuid(), name: data.name.trim(), email: data.email, phone: data.phone,
            checkIn: data.checkIn, checkOut: data.checkOut, guests: guests, bungalow: data.bungalow,
            notes: notes, status: 'pending', timestamp: new Date().toISOString(), approved_date: null, rejected_date: null
        };
        if (conflictsWithApproved(res, list)) {
            return reply(409, { message: 'Seçilen tarihler bu bungalov için uygun değildir. Lütfen başka tarihler seçiniz.' });
        }
        list.push(res);
        save(list);
        return reply(201, { message: 'Rezervasyon başarıyla kaydedildi! Admin onayı bekleniyor.', reservation_id: res.id });
    }

    function decide(id, status) {
        var list = load(), res = null;
        list.forEach(function (r) { if (r.id === id) res = r; });
        if (!res) return reply(404, { message: 'Rezervasyon bulunamadı.' });
        if (res.status !== 'pending') {
            return reply(409, { message: status === 'approved' ? 'Bu tarihler artık uygun değil veya talep zaten karara bağlandı.' : 'Talep zaten karara bağlandı.' });
        }
        if (status === 'approved' && conflictsWithApproved(res, list)) {
            return reply(409, { message: 'Bu tarihler artık uygun değil veya talep zaten karara bağlandı.' });
        }
        res.status = status;
        res[status === 'approved' ? 'approved_date' : 'rejected_date'] = new Date().toISOString();
        save(list);
        return status === 'approved'
            ? reply(200, { message: 'Rezervasyon onaylandı!', reservation: res })
            : reply(200, { message: 'Rezervasyon reddedildi.' });
    }

    function route(method, url, body) {
        var path = url.pathname;
        var m;

        if (path === '/admin/login' && method === 'POST') {
            if (body && body.username === DEMO_USER && body.password === DEMO_PASS) {
                set('session', ADMIN, '1');
                return reply(200, { success: true });
            }
            return reply(401, { success: false, message: 'Geçersiz kullanıcı adı veya şifre' });
        }

        if (path === '/api/reservation' && method === 'POST') return createReservation(body);

        if (path === '/api/booked-dates' && method === 'GET') {
            var wanted = url.searchParams.get('bungalow') || '', dates = {};
            load().forEach(function (r) {
                // Herkese açık takvim yalnızca onaylı konaklamaları gösterir.
                if (r.status === 'approved' && (!wanted || r.bungalow === wanted)) eachNight(r, function (d) { dates[d] = true; });
            });
            return reply(200, { booked_dates: Object.keys(dates) });
        }

        // Buradan sonrası yönetici oturumu ister.
        if (!isAdmin()) return reply(401, { message: 'Giriş gerekli.' });

        if (path === '/api/reservations' && method === 'GET') return reply(200, newestFirst(load()));
        if (path === '/api/reservations/pending' && method === 'GET') {
            return reply(200, newestFirst(load()).filter(function (r) { return r.status === 'pending'; }));
        }
        if ((m = /^\/api\/reservations\/([^/]+)\/(approve|reject)$/.exec(path)) && method === 'POST') {
            return decide(decodeURIComponent(m[1]), m[2] === 'approve' ? 'approved' : 'rejected');
        }
        if ((m = /^\/api\/bungalow-dates\/(.+)$/.exec(path)) && method === 'GET') {
            var bungalow = decodeURIComponent(m[1]), info = {};
            newestFirst(load()).forEach(function (r) {
                if (r.bungalow !== bungalow || (r.status !== 'approved' && r.status !== 'pending')) return;
                eachNight(r, function (d) { if (!info[d]) info[d] = { status: r.status, guest_name: r.name || 'Misafir' }; });
            });
            return reply(200, { bungalow: bungalow, date_info: info });
        }
        return reply(404, { message: 'Bulunamadı.' });
    }

    var realFetch = window.fetch ? window.fetch.bind(window) : null;
    window.fetch = function (input, init) {
        var raw = typeof input === 'string' ? input : (input && input.url) || '';
        var url;
        try { url = new URL(raw, location.href); } catch (e) { return realFetch(input, init); }
        if (url.origin !== location.origin || !(url.pathname.indexOf('/api/') === 0 || url.pathname === '/admin/login')) {
            return realFetch(input, init);
        }
        var body = null;
        try { body = init && init.body ? JSON.parse(init.body) : null; } catch (e) { return reply(400, { message: 'JSON nesnesi gerekli.' }); }
        return route(((init && init.method) || 'GET').toUpperCase(), url, body);
    };

    // Yönetici sayfası oturum olmadan açılmasın.
    if (/\/admin(\.html)?$/.test(location.pathname) && get('session', ADMIN) !== '1') {
        location.replace('admin-login.html');
    }

    window.KozalakDemo = {
        reset: function () {
            del('local', KEY); del('local', SEEDED); del('session', ADMIN);
            location.reload();
        },
        logout: function () { del('session', ADMIN); }
    };

    seed();
})();
