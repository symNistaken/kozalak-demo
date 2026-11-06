# Kozalak Bungalov: canlı demo

Bungalov işletmeleri için online rezervasyon sisteminin **sunucusuz tanıtım demosu**. GitHub Pages üzerinde yayınlanır.

- `index.html`: satış sayfası (nasıl çalışır, paketler, SSS, WhatsApp ve e-posta ile iletişim, teklif formu). Paylaşılacak bağlantı budur.
- `demo/`: örnek bir işletmenin (The Intense Bungalov) sitesi: ana sayfa, bungalovlar, galeri, rezervasyon ve yönetici paneli.

## Demo nasıl çalışıyor?

Bu demoda sunucu ve veritabanı **yoktur**. Rezervasyonlar ve yönetici işlemleri ziyaretçinin kendi tarayıcısında (`localStorage`) tutulur, hiçbir bilgi kimseye gönderilmez. Gerçek sistemde aynı ekranlar bir sunucu, veritabanı ve e-posta bildirimleriyle çalışır.

- Yönetici girişi: `admin` / `demo1234` (herkese açık demo şifresi, gerçek bir şifre değildir).
- Sayfanın altındaki "Örnek verileri sıfırla" düğmesi demoyu başlangıç haline döndürür.
- `demo/assets/demo-api.js`, sitenin sunucuya yaptığı çağrıları tarayıcıda taklit eder. Doğrulama ve çakışma kuralları gerçek sistemdekiyle aynıdır.
- Teklif formu sunucuya göndermez; bilgilerle hazır bir WhatsApp mesajı açar.

## Dosya yapısı

```text
index.html                 Satış sayfası
assets/sales.css           Satış sayfasına özel stiller
demo/                      Örnek işletme sitesi
  assets/site.css          Ortak tasarım sistemi
  assets/site.js           Header/footer, galeri, lightbox, rezervasyon takvimi
  assets/data.js           Bungalov bilgileri ve fotoğraf listesi (fiyatlar örnektir)
  assets/demo-api.js       Sunucuyu taklit eden katman
  assets/img/<bungalov>/   Web için küçültülmüş fotoğraflar (+ thumb/ önizlemeler)
  assets/video/            hero.mp4 (döngü), tour.mp4 (tam tur), poster.jpg
```

## Yerelde deneme

```bash
python -m http.server 8000
```

Sonra `http://localhost:8000` adresini aç. (`file://` ile çift tıklayarak açmak yerine sunucu kullan.)

## Başka bir işletme için uyarlama

`demo/assets/data.js` içindeki bungalov adlarını, fiyatları ve özellikleri değiştir; fotoğrafları `demo/assets/img/<bungalov>/01.jpg, 02.jpg...` (uzun kenar en fazla 1600 px) ve `thumb/` (640 px) klasörlerine koy. Logo için `demo/assets/img/logo.png` dosyasını değiştir. Bungalov adları `demo/assets/demo-api.js` içindeki `BUNGALOWS` listesiyle aynı olmalıdır.

## Kendi alan adına bağlama

1. Depo kökünde `CNAME` adında bir dosya oluştur, içine sadece alan adını yaz (örnek: `kozalakbungalov.com`).
2. Alan adı sağlayıcında DNS kaydı ekle: `www` için `CNAME` kaydı `symnistaken.github.io` değerine; kök alan adı için GitHub'ın [A kayıtları](https://docs.github.com/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site).
3. Depoda **Settings → Pages** bölümünde alan adını doğrulayıp **Enforce HTTPS** seçeneğini aç.

## İletişim

Kozalak Bungalov: berkayseyman@gmail.com · [WhatsApp](https://wa.me/905340806421)

## Notlar

Örnek işletme olarak kullanılan fotoğraflar, video ve logo "The Intense" bungalov işletmesine ait materyallerdir; yayın ve satış amaçlı kullanım için sahibinin izni gerekir. Site arayüzünün ilk sürümünün kökü [CGhost1908/bungalow](https://github.com/CGhost1908/bungalow) projesidir; bu depodaki tasarım ve kod ondan bağımsız olarak yeniden yazılmıştır.
