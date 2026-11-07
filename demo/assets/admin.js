/*
 * Kozalak yönetim paneli: konaklama çizelgesi + talepler.
 * Demo ve gerçek ürün aynı dosyayı kullanır; farklar window.ADMIN_CFG ile verilir:
 *   bungalows: [{ name, code?, cover? }], loginUrl, logout()
 */
(function () {
    'use strict';
    var CFG = window.ADMIN_CFG || {};
    var PALETTE = ['#4f86c6', '#e0a526', '#3fb2b7', '#e8742a', '#8e6bbf', '#4aa56b'];
    var BUNGS = (CFG.bungalows || []).map(function (b, i) {
        return { name: b.name, code: b.code || '', cover: b.cover || '', color: b.color || PALETTE[i % PALETTE.length] };
    });
    var CSRF = (document.querySelector('meta[name=csrf-token]') || {}).content || '';
    var LOGIN = CFG.loginUrl || '/admin/login';

    var $ = function (s, r) { return (r || document).querySelector(s); };
    var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
    var TITLES = {
        grid: ['Konaklama çizelgesi', 'Her bungalov için günlük doluluk, kişi bilgileri ve ödemeler.'],
        inbox: ['Bekleyen talepler', 'Siteden gelen, karar bekleyen rezervasyon talepleri.'],
        all: ['Tüm rezervasyonlar', 'Geçmiş ve güncel bütün kayıtlar.']
    };
    var ROWS = [['name', 'Ad Soyad / Kişi'], ['phone', 'İletişim'], ['tc', 'TC'], ['gelen', 'Gelen'], ['kahvalti', 'Kahvaltı'], ['kapora', 'Kapora'], ['kalan', 'Alınacak']];

    var today = midnight(new Date());
    var state = { view: 'grid', span: 7, start: today, filter: 'all', query: '', list: [] };

    /* ---------- yardımcılar ---------- */
    function midnight(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
    function pad(n) { return (n < 10 ? '0' : '') + n; }
    function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
    function parse(s) { var p = s.split('-'); return new Date(+p[0], p[1] - 1, +p[2]); }
    function addDays(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
    function nightsOf(r) { return Math.round((parse(r.checkOut) - parse(r.checkIn)) / 864e5); }
    function esc(v) { var s = document.createElement('span'); s.textContent = String(v == null ? '' : v); return s.innerHTML; }
    function money(n) { return Number(n || 0).toLocaleString('tr-TR') + ' ₺'; }
    function fmt(s) { return parse(s).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' }); }
    function statusText(s) { return s === 'approved' ? 'Onaylı' : s === 'rejected' ? 'Reddedildi' : 'Beklemede'; }
    function remaining(r) { return Math.max(0, (+r.total || 0) - (+r.kapora || 0)); }
    function bungByName(n) { return BUNGS.filter(function (b) { return b.name === n; })[0]; }
    function bungLabel(b) { return (b.code ? b.code + ' - ' : '') + b.name; }

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

    function overlay(html, wide) {
        var back = document.createElement('div');
        back.className = 'dlg-back';
        back.innerHTML = '<div class="dlg' + (wide ? ' wide' : '') + '" role="dialog" aria-modal="true">' + html + '</div>';
        function key(e) { if (e.key === 'Escape') close(); }
        function close() { document.removeEventListener('keydown', key); back.remove(); }
        back.close = close;
        back.addEventListener('mousedown', function (e) { if (e.target === back) close(); });
        document.addEventListener('keydown', key);
        document.body.appendChild(back);
        return back;
    }

    function confirmDlg(title, text, yes, danger) {
        return new Promise(function (resolve) {
            var back = overlay('<h3>' + esc(title) + '</h3><p>' + esc(text) + '</p><div class="row"><button type="button" class="btn btn-outline" data-r="0">Vazgeç</button><button type="button" class="btn ' + (danger ? 'btn-amber' : 'btn-teal') + '" data-r="1">' + esc(yes) + '</button></div>');
            var done = back.close;
            back.close = function () { done(); resolve(false); };
            back.addEventListener('click', function (e) {
                var b = e.target.closest('[data-r]');
                if (b) { done(); resolve(b.dataset.r === '1'); }
            });
            $('[data-r="1"]', back).focus();
        });
    }

    async function api(path, opts) {
        opts = opts || {};
        opts.headers = Object.assign({ 'X-CSRFToken': CSRF }, opts.headers || {});
        var r = await fetch(path, opts);
        if (r.status === 401 || r.redirected) { location.replace(LOGIN); throw new Error('auth'); }
        return r;
    }
    async function send(method, path, body) {
        var r = await api(path, { method: method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
        var data = {}; try { data = await r.json(); } catch (e) { /* boş yanıt */ }
        return { ok: r.ok, data: data };
    }

    /* ---------- veri ---------- */
    async function load() {
        var r = await api('/api/reservations');
        state.list = await r.json();
        render();
    }

    function counts() {
        var c = { total: state.list.length, pending: 0, approved: 0, rejected: 0 };
        state.list.forEach(function (x) { if (c[x.status] != null) c[x.status]++; });
        return c;
    }

    /* ---------- üst kutular ---------- */
    function tile(label, value, cls) { return '<div class="tile ' + (cls || '') + '"><small>' + label + '</small><strong>' + value + '</strong></div>'; }

    function windowDays() {
        var days = [];
        for (var i = 0; i < state.span; i++) days.push(iso(addDays(state.start, i)));
        return days;
    }

    function tilesHtml(days) {
        var c = counts();
        $('#navPending').textContent = c.pending; $('#navPending').hidden = c.pending === 0;
        if (state.view !== 'grid') {
            return tile('Toplam', c.total) + tile('Beklemede', c.pending, 't-wait') + tile('Onaylı', c.approved, 't-ok') + tile('Reddedilen', c.rejected, 't-no');
        }
        var first = days[0], last = days[days.length - 1], nights = 0, sum = 0, paid = 0, due = 0;
        state.list.forEach(function (r) {
            if (r.status === 'rejected') return;
            if (r.status === 'approved') {
                var d = parse(r.checkIn < first ? first : r.checkIn), end = parse(r.checkOut), stop = addDays(parse(last), 1);
                while (d < end && d < stop) { nights++; d = addDays(d, 1); }
            }
            if (r.status === 'approved' && r.checkIn >= first && r.checkIn <= last) {
                var rest = remaining(r);
                sum += +r.total || 0;
                paid += (+r.kapora || 0) + (r.kalan_odendi ? rest : 0);
                due += r.kalan_odendi ? 0 : rest;
            }
        });
        var pct = BUNGS.length ? Math.round(nights * 100 / (BUNGS.length * days.length)) : 0;
        return tile('Doluluk', '%' + pct) + tile('Toplam tutar', money(sum), 't-ok') + tile('Tahsil edilen', money(paid), 't-ok') + tile('Kalan alacak', money(due), 't-wait');
    }

    /* ---------- çizelge ---------- */
    function cellText(res, key) {
        switch (key) {
            case 'name': return esc(res.name) + (res.status === 'pending' ? ' <em class="pb">onay bekliyor</em>' : '');
            case 'phone': return esc(res.phone);
            case 'tc': return esc(res.tc);
            case 'gelen': return esc(res.guests + ' kişi' + (res.gelen ? ' · ' + res.gelen : ''));
            case 'kahvalti': return esc(res.kahvalti);
            case 'kapora': return +res.kapora > 0 ? esc(money(res.kapora) + ' alındı' + (res.kapora_note ? ' ' + res.kapora_note : '')) : '';
            case 'kalan':
                if (!(+res.total > 0)) return '';
                var rest = remaining(res);
                return rest > 0 ? esc(money(rest) + (res.kalan_odendi ? ' alındı' : '')) : esc('Ödendi');
            case 'toplam': return +res.total > 0 ? esc(money(res.total)) : '';
        }
        return '';
    }

    function segmentsFor(bung, days) {
        var owner = {}, segAt = {};
        var list = state.list.filter(function (r) { return r.bungalow === bung.name && r.status !== 'rejected'; });
        list.sort(function (a, b) {   // onaylılar önce, sonra eskiden yeniye
            if (a.status !== b.status) return a.status === 'approved' ? -1 : 1;
            return a.timestamp < b.timestamp ? -1 : 1;
        });
        list.forEach(function (r) {
            days.forEach(function (d) { if (d >= r.checkIn && d < r.checkOut && !owner[d]) owner[d] = r; });
        });
        for (var i = 0; i < days.length;) {
            var r = owner[days[i]];
            if (!r) { i++; continue; }
            var len = 1;
            while (i + len < days.length && owner[days[i + len]] === r) len++;
            segAt[i] = { res: r, len: len };
            i += len;
        }
        return segAt;
    }

    function dayHeader(days) {
        var todayIso = iso(today);
        return days.map(function (d) {
            var dt = parse(d), cls = (d === todayIso ? ' today' : '') + (dt.getDay() === 0 || dt.getDay() === 6 ? ' wkend' : '');
            return '<th class="dh' + cls + '"><b>' + dt.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' }) + '</b><span>' + dt.toLocaleDateString('tr-TR', { weekday: 'long' }) + '</span></th>';
        }).join('');
    }

    function rowCells(segAt, days, bung, key) {
        var h = '', i = 0;
        while (i < days.length) {
            var s = segAt[i];
            if (s) {
                var r = s.res, cls = 'cell ' + (r.status === 'pending' ? 'pend' : 'occ');
                if (key === 'kapora') cls += ' pay';
                if (key === 'kalan') cls += ' pay ' + (remaining(r) === 0 || r.kalan_odendi ? 'done' : 'due');
                if (key === 'toplam') cls = 'cell tot';
                var txt = cellText(r, key);
                h += '<td colspan="' + s.len + '" class="' + cls + '" data-id="' + esc(r.id) + '"' + (txt && key !== 'toplam' ? ' title="' + esc(r.name) + '"' : '') + '>' + txt + '</td>';
                i += s.len;
            } else {
                h += '<td class="free' + (key === 'toplam' ? ' tot' : '') + '" data-new="' + esc(bung.name) + '|' + days[i] + '"></td>';
                i++;
            }
        }
        return h;
    }

    function gridHtml(days) {
        var h = '<table class="sheet"><colgroup><col class="c-lab"><col class="c-bg">' + days.map(function () { return '<col class="c-day">'; }).join('') + '</colgroup><tbody>';
        BUNGS.forEach(function (b) {
            var seg = segmentsFor(b, days);
            h += '<tr class="hd"><th class="lab corner"></th><th class="bg" rowspan="8" style="--bc:' + b.color + '"><div>' + esc(bungLabel(b)) + '</div></th>' + dayHeader(days) + '</tr>';
            ROWS.forEach(function (row) {
                h += '<tr class="r-' + row[0] + '"><th class="lab">' + row[1] + '</th>' + rowCells(seg, days, b, row[0]) + '</tr>';
            });
            h += '<tr class="r-toplam"><th class="lab tl" colspan="2">Toplam</th>' + rowCells(seg, days, b, 'toplam') + '</tr>';
            h += '<tr class="gap"><td colspan="' + (days.length + 2) + '"></td></tr>';
        });
        return h + '</tbody></table>';
    }

    function rangeLabel(days) {
        var a = parse(days[0]), b = parse(days[days.length - 1]);
        var same = a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
        return a.toLocaleDateString('tr-TR', same ? { day: 'numeric' } : { day: 'numeric', month: 'long' }) + ' – ' + b.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
    }

    /* ---------- listeler ---------- */
    function card(r) {
        var b = bungByName(r.bungalow);
        var bg = b && b.cover ? 'background-image:url(\'' + b.cover.replace(/'/g, '') + '\')' : 'background:' + (b ? b.color : '#1c7a6b');
        var st = ['pending', 'approved', 'rejected'].indexOf(r.status) > -1 ? r.status : 'pending';
        var acts = '<div class="acts">' + (r.status === 'pending'
            ? '<button class="ab y" data-act="approve" data-id="' + esc(r.id) + '">Onayla</button><button class="ab n" data-act="reject" data-id="' + esc(r.id) + '">Reddet</button>' : '') +
            '<button class="ab e" data-act="edit" data-id="' + esc(r.id) + '">Düzenle</button></div>';
        var pay = +r.total > 0 ? '<div class="pay-line">Toplam <b>' + money(r.total) + '</b> · Kapora <b>' + money(r.kapora) + '</b> · Kalan <b>' + money(remaining(r)) + '</b>' + (r.kalan_odendi ? ' (alındı)' : '') + '</div>' : '';
        return '<article class="card">' +
            '<div class="ph" style="' + bg + '"><span>' + esc(r.bungalow) + '</span></div>' +
            '<div class="body"><h3>' + esc(r.name) + ' <span class="st ' + st + '">' + statusText(st) + '</span></h3>' +
            '<div class="when">' + fmt(r.checkIn) + ' &rarr; ' + fmt(r.checkOut) + '<em>' + nightsOf(r) + ' gece</em></div>' +
            '<div class="meta">' + (r.email ? '<span>' + IC.mail + esc(r.email) + '</span>' : '') + (r.phone ? '<span>' + IC.phone + esc(r.phone) + '</span>' : '') + '<span>' + IC.users + esc(r.guests) + ' kişi</span></div>' + pay + '</div>' +
            acts + '</article>';
    }

    function empty(title, text) { return '<div class="empty">' + IC.inbox + '<b>' + title + '</b>' + text + '</div>'; }

    function render() {
        var t = TITLES[state.view], days = windowDays();
        $('#viewTitle').textContent = t[0]; $('#viewSub').textContent = t[1];
        $$('[data-pane]').forEach(function (p) { p.hidden = p.dataset.pane !== state.view; });
        $$('.side [data-view]').forEach(function (b) { b.setAttribute('aria-current', b.dataset.view === state.view ? 'true' : 'false'); });
        $('#tiles').innerHTML = tilesHtml(days);

        if (state.view === 'grid') {
            $('#rangeLabel').textContent = rangeLabel(days);
            $('#gotoDate').value = iso(state.start);
            $$('#spanChips .chip').forEach(function (c) { c.setAttribute('aria-pressed', String(+c.dataset.span === state.span)); });
            $('#sheet').innerHTML = BUNGS.length ? gridHtml(days) : empty('Bungalov tanımlı değil', 'Ayarlardan bungalov ekleyin.');
        }
        var pending = state.list.filter(function (r) { return r.status === 'pending'; });
        $('#inboxList').innerHTML = pending.length ? pending.map(card).join('') : empty('Her şey yolunda', 'Karar bekleyen talep yok.');
        var q = state.query.trim().toLocaleLowerCase('tr');
        var rows = state.list.filter(function (r) {
            if (state.filter !== 'all' && r.status !== state.filter) return false;
            return !q || [r.name, r.email, r.phone, r.bungalow, r.tc].join(' ').toLocaleLowerCase('tr').indexOf(q) > -1;
        });
        $('#allList').innerHTML = rows.length ? rows.map(card).join('') : empty('Kayıt bulunamadı', 'Filtreyi veya aramayı değiştirmeyi deneyin.');
    }

    /* ---------- karar ---------- */
    async function decide(id, act, fromDialog) {
        var approve = act === 'approve';
        var r = byId(id);
        var ok = await confirmDlg(approve ? 'Rezervasyonu onayla' : 'Rezervasyonu reddet',
            (r ? r.name + ', ' + r.bungalow + ' (' + fmt(r.checkIn) + ' – ' + fmt(r.checkOut) + ')' : '') + (approve ? ' için talep onaylanacak.' : ' için talep reddedilecek.'),
            approve ? 'Onayla' : 'Reddet', !approve);
        if (!ok) return false;
        try {
            var res = await send('POST', '/api/reservations/' + encodeURIComponent(id) + '/' + act);
            toast(res.ok ? (approve ? 'Rezervasyon onaylandı.' : 'Rezervasyon reddedildi.') : (res.data.message || 'İşlem yapılamadı.'), res.ok);
            await load();
            return res.ok;
        } catch (e) { if (e.message !== 'auth') toast('Bir hata oluştu.', false); }
        return false;
    }
    function byId(id) { return state.list.filter(function (x) { return String(x.id) === String(id); })[0]; }

    /* ---------- rezervasyon formu (ekle / düzenle) ---------- */
    function field(id, label, value, opts) {
        opts = opts || {};
        return '<div class="field' + (opts.full ? ' full' : '') + '"><label for="f_' + id + '">' + label + '</label>' +
            '<input id="f_' + id + '" type="' + (opts.type || 'text') + '" value="' + esc(value) + '"' + (opts.ph ? ' placeholder="' + esc(opts.ph) + '"' : '') + (opts.attrs || '') + '></div>';
    }

    function openForm(res, defaults) {
        var isNew = !res;
        var r = res || Object.assign({ name: '', phone: '', email: '', tc: '', guests: 2, gelen: '', kahvalti: '', total: 0, kapora: 0, kapora_note: '', kalan_odendi: 0, notes: '', status: 'approved' }, defaults || {});
        var opts = BUNGS.map(function (b) { return '<option value="' + esc(b.name) + '"' + (b.name === r.bungalow ? ' selected' : '') + '>' + esc(bungLabel(b)) + '</option>'; }).join('');
        var html = '<h3>' + (isNew ? 'Yeni rezervasyon' : esc(r.name)) + (isNew ? '' : ' <span class="st ' + r.status + '">' + statusText(r.status) + '</span>') + '</h3>' +
            '<p class="sub">' + (isNew ? 'Telefonla veya yüz yüze alınan rezervasyonu doğrudan onaylı olarak ekleyin.' : 'Bilgileri değiştirip kaydedin.') + '</p>' +
            '<form id="resForm" novalidate><div class="fgrid">' +
            field('name', 'Ad soyad', r.name, { attrs: ' autocomplete="off" maxlength="100"' }) + field('phone', 'İletişim (telefon)', r.phone, { type: 'tel', attrs: ' autocomplete="off"' }) +
            field('tc', 'TC kimlik no', r.tc, { attrs: ' inputmode="numeric" maxlength="11" autocomplete="off"' }) + field('email', 'E-posta', r.email, { type: 'email', attrs: ' autocomplete="off"' }) +
            '<div class="field"><label for="f_bungalow">Bungalov</label><select id="f_bungalow">' + opts + '</select></div>' +
            field('guests', 'Kişi sayısı', r.guests, { type: 'number', attrs: ' min="1" max="20"' }) +
            field('checkIn', 'Giriş', r.checkIn, { type: 'date' }) + field('checkOut', 'Çıkış', r.checkOut, { type: 'date' }) +
            field('gelen', 'Gelen (balayı, karışık...)', r.gelen, { attrs: ' maxlength="100"' }) + field('kahvalti', 'Kahvaltı', r.kahvalti, { ph: 'yok / 2 kişi kahvaltı', attrs: ' maxlength="100"' }) +
            field('total', 'Toplam tutar (₺)', +r.total || 0, { type: 'number', attrs: ' min="0" step="1"' }) + field('kapora', 'Kapora (₺)', +r.kapora || 0, { type: 'number', attrs: ' min="0" step="1"' }) +
            field('kapora_note', 'Kapora notu', r.kapora_note, { ph: 'nakit / havale', attrs: ' maxlength="60"' }) +
            '<div class="field chk"><label class="chk-l"><input id="f_kalan_odendi" type="checkbox"' + (r.kalan_odendi ? ' checked' : '') + '> Kalan tutar tahsil edildi</label><div class="calc" id="calc"></div></div>' +
            '<div class="field full"><label for="f_notes">Not</label><textarea id="f_notes" rows="2" maxlength="500">' + esc(r.notes) + '</textarea></div>' +
            '</div><div class="err" id="formErr" role="alert"></div>' +
            '<div class="row split">' + (isNew ? '<span></span>' : '<button type="button" class="btn btn-danger" data-do="delete">Sil</button>') +
            '<span class="grp">' + (!isNew && r.status === 'pending' ? '<button type="button" class="btn btn-outline" data-do="reject">Reddet</button><button type="button" class="btn btn-teal" data-do="approve">Onayla</button>' : '') +
            '<button type="button" class="btn btn-outline" data-do="cancel">Vazgeç</button><button type="submit" class="btn btn-amber">' + (isNew ? 'Ekle' : 'Kaydet') + '</button></span></div></form>';
        var back = overlay(html, true);
        var form = $('#resForm', back);

        function calc() {
            var t = parseInt($('#f_total', back).value, 10) || 0, k = parseInt($('#f_kapora', back).value, 10) || 0;
            var n = Math.round((new Date($('#f_checkOut', back).value) - new Date($('#f_checkIn', back).value)) / 864e5);
            $('#calc', back).textContent = (t > 0 ? 'Alınacak: ' + money(Math.max(0, t - k)) : '') + (n > 0 ? (t > 0 ? ' · ' : '') + n + ' gece' : '');
        }
        form.addEventListener('input', calc); calc();
        $('#f_name', back).focus();

        function showErr(msg) { var e = $('#formErr', back); e.textContent = msg; e.classList.add('show'); }
        form.addEventListener('submit', async function (e) {
            e.preventDefault();
            $('#formErr', back).classList.remove('show');
            var v = function (id) { return $('#f_' + id, back).value.trim(); };
            if (!v('name')) return showErr('Ad soyad gerekli.');
            if (!v('checkIn') || !v('checkOut')) return showErr('Giriş ve çıkış tarihi gerekli.');
            if (v('checkOut') <= v('checkIn')) return showErr('Çıkış tarihi girişten sonra olmalı.');
            var num = function (id) { var s = v(id); return s === '' ? 0 : (/^\d+$/.test(s) ? parseInt(s, 10) : NaN); };
            var body = {
                name: v('name'), phone: v('phone'), email: v('email'), tc: v('tc'), bungalow: v('bungalow'),
                guests: parseInt(v('guests'), 10) || 0, checkIn: v('checkIn'), checkOut: v('checkOut'),
                gelen: v('gelen'), kahvalti: v('kahvalti'), kapora_note: v('kapora_note'), notes: $('#f_notes', back).value.trim(),
                total: num('total'), kapora: num('kapora'), kalan_odendi: $('#f_kalan_odendi', back).checked
            };
            if (isNaN(body.total) || isNaN(body.kapora)) return showErr('Tutarlar sayı olmalı.');
            var btn = $('[type=submit]', back); btn.disabled = true;
            try {
                var res = isNew ? await send('POST', '/api/admin/reservations', body) : await send('PATCH', '/api/reservations/' + encodeURIComponent(r.id), body);
                if (!res.ok) { btn.disabled = false; return showErr(res.data.message || 'Kaydedilemedi.'); }
                back.close(); toast(isNew ? 'Rezervasyon eklendi.' : 'Değişiklikler kaydedildi.', true); await load();
            } catch (x) { btn.disabled = false; if (x.message !== 'auth') showErr('Bir hata oluştu.'); }
        });
        back.addEventListener('click', async function (e) {
            var b = e.target.closest('[data-do]'); if (!b) return;
            var what = b.dataset.do;
            if (what === 'cancel') return back.close();
            if (what === 'delete') {
                if (await confirmDlg('Rezervasyonu sil', r.name + ' kaydı kalıcı olarak silinecek. Bu işlem geri alınamaz.', 'Sil', true)) {
                    var res = await send('DELETE', '/api/reservations/' + encodeURIComponent(r.id));
                    toast(res.ok ? 'Rezervasyon silindi.' : (res.data.message || 'Silinemedi.'), res.ok);
                    if (res.ok) { back.close(); await load(); }
                }
            } else if (await decide(r.id, what)) back.close();
        });
    }

    /* ---------- olaylar ---------- */
    document.addEventListener('click', function (e) {
        var v = e.target.closest('.side [data-view]');
        if (v) { state.view = v.dataset.view; render(); return; }
        var a = e.target.closest('[data-act]');
        if (a) { if (a.dataset.act === 'edit') openForm(byId(a.dataset.id)); else decide(a.dataset.id, a.dataset.act); return; }
        var f = e.target.closest('#statusChips [data-f]');
        if (f) {
            state.filter = f.dataset.f;
            $$('#statusChips .chip').forEach(function (c) { c.setAttribute('aria-pressed', String(c === f)); });
            render(); return;
        }
        var sp = e.target.closest('#spanChips [data-span]');
        if (sp) { state.span = +sp.dataset.span; render(); return; }
        var cell = e.target.closest('#sheet td[data-id]');
        if (cell) { openForm(byId(cell.dataset.id)); return; }
        var fr = e.target.closest('#sheet td[data-new]');
        if (fr) {
            var p = fr.dataset.new.split('|');
            openForm(null, { bungalow: p[0], checkIn: p[1], checkOut: iso(addDays(parse(p[1]), 1)) });
        }
    });
    $('#q').addEventListener('input', function (e) { state.query = e.target.value; render(); });
    $('#navPrev').addEventListener('click', function () { state.start = addDays(state.start, -state.span); render(); });
    $('#navNext').addEventListener('click', function () { state.start = addDays(state.start, state.span); render(); });
    $('#navToday').addEventListener('click', function () { state.start = today; render(); });
    $('#gotoDate').addEventListener('change', function (e) { if (e.target.value) { state.start = parse(e.target.value); render(); } });
    $('#addBtn').addEventListener('click', function () {
        openForm(null, { bungalow: BUNGS[0] && BUNGS[0].name, checkIn: iso(state.start), checkOut: iso(addDays(state.start, 1)) });
    });
    $('#logout').addEventListener('click', function () { if (CFG.logout) CFG.logout(); });

    load().catch(function () { /* oturum yoksa giriş sayfasına yönlendirildi */ });
})();
