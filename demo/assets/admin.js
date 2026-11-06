/* Kozalak yönetici paneli */
(function () {
    'use strict';
    var $ = function (s, r) { return (r || document).querySelector(s); };
    var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
    var BUNGS = (window.KOZALAK && window.KOZALAK.bungalows) || [];
    var CSRF = $('meta[name=csrf-token]').content;
    var TITLES = {
        inbox: ['Bekleyen talepler', 'Karar bekleyen rezervasyon talepleri.'],
        all: ['Tüm rezervasyonlar', 'Geçmiş ve güncel bütün kayıtlar.'],
        calendar: ['Doluluk takvimi', 'Bungalov seçip aylık doluluğu görün.']
    };
    var state = { view: 'inbox', filter: 'all', query: '', list: [], bung: '', month: firstOfMonth(new Date()), dates: {} };

    function firstOfMonth(d) { return new Date(d.getFullYear(), d.getMonth(), 1); }
    function esc(v) { var s = document.createElement('span'); s.textContent = String(v == null ? '' : v); return s.innerHTML; }
    function fmt(iso) { var p = iso.split('-'); return new Date(+p[0], p[1] - 1, +p[2]).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' }); }
    function nights(r) { var a = r.checkIn.split('-'), b = r.checkOut.split('-'); return Math.round((new Date(+b[0], b[1] - 1, +b[2]) - new Date(+a[0], a[1] - 1, +a[2])) / 864e5); }
    function isoOf(y, m, d) { return y + '-' + String(m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0'); }
    function bungByName(n) { return BUNGS.filter(function (b) { return b.name === n; })[0]; }
    function cover(n) {
        var b = bungByName(n);
        if (!b) return '';
        return 'assets/img/' + b.slug + '/thumb/' + String(b.cover).padStart(2, '0') + '.jpg';
    }
    function statusText(s) { return s === 'approved' ? 'Onaylı' : s === 'rejected' ? 'Reddedildi' : 'Beklemede'; }

    var IC = {
        mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>',
        phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg>',
        users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/></svg>',
        inbox: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5h13L22 12v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6z"/></svg>'
    };

    function toast(msg, ok) {
        var t = document.createElement('div');
        t.className = 'toast ' + (ok ? 'ok' : 'bad'); t.setAttribute('role', 'status'); t.textContent = msg;
        document.body.appendChild(t); setTimeout(function () { t.remove(); }, 3200);
    }

    function confirmDlg(title, text, yes, danger) {
        return new Promise(function (resolve) {
            var back = document.createElement('div');
            back.className = 'dlg-back';
            back.innerHTML = '<div class="dlg" role="dialog" aria-modal="true" aria-label="' + esc(title) + '"><h3>' + esc(title) + '</h3><p>' + esc(text) + '</p><div class="row"><button type="button" class="btn btn-outline" data-r="0">Vazgeç</button><button type="button" class="btn ' + (danger ? 'btn-amber' : 'btn-teal') + '" data-r="1">' + esc(yes) + '</button></div></div>';
            function done(v) { document.removeEventListener('keydown', key); back.remove(); resolve(v); }
            function key(e) { if (e.key === 'Escape') done(false); }
            back.addEventListener('click', function (e) {
                if (e.target === back) done(false);
                var b = e.target.closest('[data-r]'); if (b) done(b.dataset.r === '1');
            });
            document.addEventListener('keydown', key);
            document.body.appendChild(back);
            $('[data-r="1"]', back).focus();
        });
    }

    async function api(path, opts) {
        var r = await fetch(path, opts);
        if (r.status === 401) { location.replace('admin-login.html'); throw new Error('auth'); }
        return r;
    }

    async function load() {
        var r = await api('/api/reservations');
        state.list = await r.json();
        var c = { pending: 0, approved: 0, rejected: 0 };
        state.list.forEach(function (x) { if (c[x.status] != null) c[x.status]++; });
        $('#cTotal').textContent = state.list.length;
        $('#cPending').textContent = c.pending;
        $('#cApproved').textContent = c.approved;
        $('#cRejected').textContent = c.rejected;
        $('#navPending').textContent = c.pending;
        $('#navPending').hidden = c.pending === 0;
        render();
    }

    function card(r) {
        var n = nights(r), img = cover(r.bungalow);
        var acts = r.status === 'pending'
            ? '<div class="acts"><button class="ab y" data-act="approve" data-id="' + esc(r.id) + '">Onayla</button><button class="ab n" data-act="reject" data-id="' + esc(r.id) + '">Reddet</button></div>'
            : '<div class="acts"></div>';
        var st = ['pending', 'approved', 'rejected'].indexOf(r.status) > -1 ? r.status : 'pending';
        return '<article class="card">' +
            '<div class="ph"' + (img ? ' style="background-image:url(\'' + img + '\')"' : '') + '><span>' + esc(r.bungalow) + '</span></div>' +
            '<div class="body"><h3>' + esc(r.name) + ' <span class="st ' + st + '">' + statusText(st) + '</span></h3>' +
            '<div class="when">' + fmt(r.checkIn) + ' &rarr; ' + fmt(r.checkOut) + '<em>' + n + ' gece</em></div>' +
            '<div class="meta"><span>' + IC.mail + esc(r.email) + '</span><span>' + IC.phone + esc(r.phone) + '</span><span>' + IC.users + esc(r.guests) + ' kişi</span></div></div>' +
            acts + '</article>';
    }

    function empty(title, text) { return '<div class="empty">' + IC.inbox + '<b>' + title + '</b>' + text + '</div>'; }

    function render() {
        var t = TITLES[state.view];
        $('#viewTitle').textContent = t[0]; $('#viewSub').textContent = t[1];
        $$('[data-pane]').forEach(function (p) { p.hidden = p.dataset.pane !== state.view; });
        $$('.side [data-view]').forEach(function (b) { b.setAttribute('aria-current', b.dataset.view === state.view ? 'true' : 'false'); });

        var pending = state.list.filter(function (r) { return r.status === 'pending'; });
        $('#inboxList').innerHTML = pending.length ? pending.map(card).join('') : empty('Her şey yolunda', 'Karar bekleyen talep yok.');

        var q = state.query.trim().toLocaleLowerCase('tr');
        var rows = state.list.filter(function (r) {
            if (state.filter !== 'all' && r.status !== state.filter) return false;
            return !q || [r.name, r.email, r.phone, r.bungalow].join(' ').toLocaleLowerCase('tr').indexOf(q) > -1;
        });
        $('#allList').innerHTML = rows.length ? rows.map(card).join('') : empty('Kayıt bulunamadı', 'Filtreyi veya aramayı değiştirmeyi deneyin.');

        if (state.view === 'calendar') drawCalendar();
    }

    async function decide(id, act) {
        var approve = act === 'approve';
        var r = state.list.filter(function (x) { return String(x.id) === String(id); })[0];
        var ok = await confirmDlg(approve ? 'Rezervasyonu onayla' : 'Rezervasyonu reddet',
            (r ? r.name + ', ' + r.bungalow + ' (' + fmt(r.checkIn) + ' – ' + fmt(r.checkOut) + ')' : '') + (approve ? ' için talep onaylanacak.' : ' için talep reddedilecek.'),
            approve ? 'Onayla' : 'Reddet', !approve);
        if (!ok) return;
        try {
            var res = await api('/api/reservations/' + encodeURIComponent(id) + '/' + act, { method: 'POST', headers: { 'X-CSRFToken': CSRF } });
            var data = {}; try { data = await res.json(); } catch (e) { /* boş yanıt */ }
            toast(res.ok ? (approve ? 'Rezervasyon onaylandı.' : 'Rezervasyon reddedildi.') : (data.message || 'İşlem yapılamadı.'), res.ok);
            await load();
        } catch (e) { if (e.message !== 'auth') toast('Bir hata oluştu.', false); }
    }

    /* ---------- Takvim ---------- */
    function drawBungChips() {
        $('#bungChips').innerHTML = BUNGS.map(function (b) {
            return '<button type="button" class="chip" data-b="' + esc(b.name) + '" aria-pressed="' + (b.name === state.bung) + '">' + esc(b.name) + '</button>';
        }).join('');
    }

    async function drawCalendar() {
        if (!state.bung && BUNGS.length) state.bung = BUNGS[0].name;
        drawBungChips();
        try {
            var r = await api('/api/bungalow-dates/' + encodeURIComponent(state.bung));
            state.dates = (await r.json()).date_info || {};
        } catch (e) { state.dates = {}; }
        var y = state.month.getFullYear(), m = state.month.getMonth();
        $('#calTitle').textContent = state.month.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
        var lead = (new Date(y, m, 1).getDay() + 6) % 7, days = new Date(y, m + 1, 0).getDate(), now = new Date();
        var todayIso = isoOf(now.getFullYear(), now.getMonth(), now.getDate()), html = '';
        for (var i = 0; i < lead; i++) html += '<div class="day off"></div>';
        for (var d = 1; d <= days; d++) {
            var iso = isoOf(y, m, d), info = state.dates[iso];
            html += '<div class="day' + (iso === todayIso ? ' today' : '') + '"><b>' + d + '</b>' +
                (info ? '<i class="' + (info.status === 'approved' ? 'approved' : 'pending') + '" title="' + esc(info.guest_name) + '">' + esc(info.guest_name) + '</i>' : '') + '</div>';
        }
        $('#calGrid').innerHTML = html;
    }

    /* ---------- Olaylar ---------- */
    document.addEventListener('click', function (e) {
        var v = e.target.closest('.side [data-view]');
        if (v) { state.view = v.dataset.view; render(); return; }
        var a = e.target.closest('[data-act]');
        if (a) { decide(a.dataset.id, a.dataset.act); return; }
        var f = e.target.closest('#statusChips [data-f]');
        if (f) {
            state.filter = f.dataset.f;
            $$('#statusChips .chip').forEach(function (c) { c.setAttribute('aria-pressed', c === f); });
            render(); return;
        }
        var b = e.target.closest('#bungChips [data-b]');
        if (b) { state.bung = b.dataset.b; drawCalendar(); }
    });
    $('#q').addEventListener('input', function (e) { state.query = e.target.value; render(); });
    $('#calPrev').addEventListener('click', function () { state.month = new Date(state.month.getFullYear(), state.month.getMonth() - 1, 1); drawCalendar(); });
    $('#calNext').addEventListener('click', function () { state.month = new Date(state.month.getFullYear(), state.month.getMonth() + 1, 1); drawCalendar(); });
    $('#calToday').addEventListener('click', function () { state.month = firstOfMonth(new Date()); drawCalendar(); });
    $('#logout').addEventListener('click', function () { KozalakDemo.logout(); location.href = 'admin-login.html'; });

    load().catch(function () { /* oturum yoksa yönlendirildi */ });
})();
