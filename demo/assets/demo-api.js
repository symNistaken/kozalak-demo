/*
 * Kozalak Bungalov - sunucusuz demo katmanı.
 *
 * Gerçek üründe bu istekleri Flask sunucusu karşılar. Bu demoda aynı adreslere yapılan
 * fetch çağrıları tarayıcıda yakalanır ve veriler yalnızca ziyaretçinin kendi
 * tarayıcısında (localStorage) tutulur. Hiçbir bilgi bir sunucuya gönderilmez.
 */
(function () {
    'use strict';

    var KEY = 'kozalak_demo_reservations_v2';
    var SEEDED = 'kozalak_demo_seeded_v2';
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
    // Çizelge alanları: yoksa boş/0 olarak tamamlanır (sunucudaki varsayılanlarla aynı).
    function withSheetFields(r) {
        ['tc', 'gelen', 'kahvalti', 'kapora_note'].forEach(function (k) { if (r[k] == null) r[k] = ''; });
        ['total', 'kapora', 'kalan_odendi'].forEach(function (k) { if (r[k] == null) r[k] = 0; });
        return r;
    }

    function seed() {
        var seeded = get('local', SEEDED), fresh = load().length > 0;
        // Örnek tarihler bugüne göre üretilir; bir haftadan eskiyse yenilenir.
        if (fresh && seeded) {
            var age = (todayDate() - parse(seeded)) / 86400000;
            if (age >= 0 && age < 7) return;
        }
        var today = todayDate(), nowIso = new Date().toISOString();
        var samples = [  // çizelge düzenindeki kurgusal örnek kayıtlar
            { name: 'Rıfat Şenkinci', bungalow: BUNGALOWS[1], start: -1, nights: 3, guests: 2, phone: '05321110001', tc: '10000000146', gelen: 'balayı', kahvalti: '2 kişi kahvaltı', total: 21000, kapora: 7000, kapora_note: 'nakit', kalan_odendi: 1, status: 'approved' },
            { name: 'Metin Arslan', bungalow: BUNGALOWS[0], start: 0, nights: 3, guests: 2, phone: '05321110002', tc: '10000000248', gelen: '', kahvalti: 'yok', total: 6500, kapora: 3000, kapora_note: 'havale', kalan_odendi: 0, status: 'approved' },
            { name: 'Yunus Çamcı', bungalow: BUNGALOWS[1], start: 3, nights: 2, guests: 4, phone: '05321110003', tc: '', gelen: 'karışık', kahvalti: 'yok', total: 7000, kapora: 1000, kapora_note: 'nakit', kalan_odendi: 0, status: 'approved' },
            { name: 'Doğanay Yıldız', bungalow: BUNGALOWS[4], start: 1, nights: 2, guests: 2, phone: '05321110004', tc: '10000000350', gelen: '', kahvalti: '2 kişi kahvaltı', total: 5400, kapora: 5000, kapora_note: 'nakit', kalan_odendi: 0, status: 'approved' },
            { name: 'Mahsul Köksal', bungalow: BUNGALOWS[2], start: 2, nights: 4, guests: 2, phone: '05321110005', tc: '', gelen: '', kahvalti: 'yok', total: 7000, kapora: 1500, kapora_note: 'havale', kalan_odendi: 0, status: 'approved' },
            { name: 'Can Arslan', bungalow: BUNGALOWS[0], start: 12, nights: 2, guests: 2, phone: '05301234567', status: 'pending' },
            { name: 'Zeynep Çelik', bungalow: BUNGALOWS[3], start: 8, nights: 3, guests: 5, phone: '05301234567', status: 'pending' }
        ];
        save(samples.map(function (s) {
            var checkIn = addDays(today, s.start);
            return withSheetFields({
                id: uuid(), name: s.name, email: 'ornek@example.com', phone: s.phone,
                checkIn: iso(checkIn), checkOut: iso(addDays(checkIn, s.nights)), guests: s.guests,
                bungalow: s.bungalow, notes: 'Örnek demo kaydı', status: s.status, timestamp: nowIso,
                approved_date: s.status === 'approved' ? nowIso : null, rejected_date: null,
                tc: s.tc, gelen: s.gelen, kahvalti: s.kahvalti, total: s.total, kapora: s.kapora,
                kapora_note: s.kapora_note, kalan_odendi: s.kalan_odendi
            });
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
        withSheetFields(res);
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

    // ---- Yönetici: elle ekleme, düzenleme, silme (sunucudaki clean_admin_fields ile aynı kurallar) ----
    var SHORT = { gelen: 100, kahvalti: 100, kapora_note: 60 };
    function parseMoney(v) {
        if (typeof v === 'boolean') return null;
        if (typeof v === 'string' && /^\d+$/.test(v.trim())) v = parseInt(v.trim(), 10);
        return (typeof v === 'number' && isFinite(v) && v % 1 === 0 && v >= 0 && v <= 10000000) ? v : null;
    }
    function cleanAdmin(data, existing) {
        var c = {}, creating = !existing, i;
        function bad(m) { return { error: m }; }
        if (creating || 'name' in data) {
            if (!validName(data.name)) return bad('Lütfen geçerli bir ad soyad yazın (2-100 karakter).');
            c.name = data.name.trim();
        }
        if ('phone' in data) {
            if (typeof data.phone !== 'string' || (data.phone.trim() && !validPhone(data.phone))) return bad('Telefon numarası geçersiz.');
            c.phone = data.phone.trim();
        }
        if ('email' in data) {
            if (typeof data.email !== 'string' || (data.email.trim() && !validEmail(data.email.trim()))) return bad('E-posta adresi geçersiz.');
            c.email = data.email.trim();
        }
        if ('tc' in data) {
            if (typeof data.tc !== 'string' || (data.tc.trim() && !/^\d{11}$/.test(data.tc.trim()))) return bad('TC kimlik numarası 11 haneli olmalıdır.');
            c.tc = data.tc.trim();
        }
        for (var f in SHORT) {
            if (f in data) {
                var v = data[f];
                if (typeof v !== 'string' || v.trim().length > SHORT[f] || /[ -]/.test(v)) return bad('"' + f + '" alanı geçersiz veya çok uzun (en fazla ' + SHORT[f] + ' karakter).');
                c[f] = v.trim();
            }
        }
        if ('notes' in data) {
            if (data.notes != null && (typeof data.notes !== 'string' || data.notes.length > 500)) return bad('Notlar 500 karakterden fazla olamaz.');
            c.notes = data.notes || '';
        }
        if ('guests' in data || creating) {
            var g = 'guests' in data ? data.guests : 1;
            if (typeof g === 'boolean' || !(parseInt(g, 10) >= 1 && parseInt(g, 10) <= 20)) return bad('Lütfen 1-20 arasında kişi sayısı yazın.');
            c.guests = parseInt(g, 10);
        }
        ['total', 'kapora'].forEach(function (k) {
            if (k in data) { var m = parseMoney(data[k]); if (m === null) { c._err = 'Tutarlar 0 ile 10.000.000 arasında tam sayı olmalıdır.'; } else c[k] = m; }
        });
        if (c._err) return bad(c._err);
        if ('kalan_odendi' in data) {
            if ([true, false, 0, 1].indexOf(data.kalan_odendi) === -1) return bad('Geçersiz ödeme durumu.');
            c.kalan_odendi = data.kalan_odendi ? 1 : 0;
        }
        if (creating || 'bungalow' in data) {
            if (BUNGALOWS.indexOf(data.bungalow) === -1) return bad('Lütfen geçerli bir bungalov seçin.');
            c.bungalow = data.bungalow;
        }
        if (creating || 'checkIn' in data || 'checkOut' in data) {
            var a = parse('checkIn' in data ? data.checkIn : existing && existing.checkIn);
            var b = parse('checkOut' in data ? data.checkOut : existing && existing.checkOut);
            if (!a || !b) return bad('Giriş ve çıkış tarihi gerekli (YYYY-AA-GG).');
            if (!(b > a) || (b - a) / 86400000 > 90) return bad('Çıkış tarihi giriş tarihinden sonra olmalı ve 90 günü aşmamalıdır.');
            c.checkIn = iso(a); c.checkOut = iso(b);
        }
        return { changes: c };
    }

    function adminCreate(data) {
        if (!data || typeof data !== 'object') return reply(400, { message: 'JSON nesnesi gerekli.' });
        var out = cleanAdmin(data, null);
        if (out.error) return reply(400, { message: out.error });
        var now = new Date().toISOString();
        var res = withSheetFields(Object.assign({ id: uuid(), email: '', phone: '', notes: '', rejected_date: null }, out.changes,
            { status: 'approved', timestamp: now, approved_date: now }));
        var list = load();
        if (conflictsWithApproved(res, list)) return reply(409, { message: 'Bu tarihlerde bu bungalov dolu.' });
        list.push(res); save(list);
        return reply(201, { message: 'Rezervasyon eklendi.', reservation: res });
    }

    function adminUpdate(id, data) {
        if (!data || typeof data !== 'object') return reply(400, { message: 'JSON nesnesi gerekli.' });
        var list = load(), res = null;
        list.forEach(function (r) { if (r.id === id) res = r; });
        if (!res) return reply(404, { message: 'Rezervasyon bulunamadı.' });
        var out = cleanAdmin(data, res);
        if (out.error) return reply(400, { message: out.error });
        var next = Object.assign({}, res, out.changes);
        if (next.status === 'approved' && conflictsWithApproved(next, list)) return reply(409, { message: 'Bu tarihlerde bu bungalov dolu.' });
        Object.assign(res, out.changes); save(list);
        return reply(200, { message: 'Rezervasyon güncellendi.', reservation: res });
    }

    function adminDelete(id) {
        var list = load(), keep = list.filter(function (r) { return r.id !== id; });
        if (keep.length === list.length) return reply(404, { message: 'Rezervasyon bulunamadı.' });
        save(keep);
        return reply(200, { message: 'Rezervasyon silindi.' });
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
        if (path === '/api/admin/reservations' && method === 'POST') return adminCreate(body);
        if ((m = /^\/api\/reservations\/([^/]+)$/.exec(path)) && method === 'PATCH') return adminUpdate(decodeURIComponent(m[1]), body);
        if ((m = /^\/api\/reservations\/([^/]+)$/.exec(path)) && method === 'DELETE') return adminDelete(decodeURIComponent(m[1]));
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
