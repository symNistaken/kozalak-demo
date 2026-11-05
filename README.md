# Kozalak Bungalov: canlı demo

Bungalov işletmeleri için online rezervasyon sisteminin **sunucusuz tanıtım demosu**. GitHub Pages üzerinde yayınlanır.

- `index.html`: satış sayfası (paketler, WhatsApp ve e-posta ile iletişim, teklif formu). Paylaşılacak bağlantı budur.
- `demo/`: örnek bir işletmenin sitesi: bungalov sayfaları, galeri, rezervasyon formu ve yönetici paneli.

## Demo nasıl çalışıyor?

Bu demoda sunucu ve veritabanı **yoktur**. Rezervasyonlar ve yönetici işlemleri ziyaretçinin kendi tarayıcısında (`localStorage`) tutulur, hiçbir bilgi kimseye gönderilmez. Gerçek sistemde aynı ekranlar bir sunucu, veritabanı ve e-posta bildirimleriyle çalışır.

- Yönetici girişi: `admin` / `demo1234` (herkese açık demo şifresi, gerçek bir şifre değildir)
- Sayfanın altındaki "Örnek verileri sıfırla" düğmesi demoyu başlangıç haline döndürür.
- `demo/assets/demo-api.js`, sitenin sunucuya yaptığı çağrıları tarayıcıda taklit eder. Doğrulama ve çakışma kuralları gerçek sistemdekiyle aynıdır.

## Yerelde deneme

```bash
python -m http.server 8000
```

Sonra `http://localhost:8000` adresini aç. (`file://` ile çift tıklayarak açmak yerine sunucu kullan.)

## Gerçek fotoğrafları ekleme

Şu an her bungalov için `demo/assets/images/<Bungalov>/1.svg` yer tutucuları var. Gerçek fotoğraflar için `1.jpg`, `2.jpg`, `3.jpg` dosyalarını aynı klasörlere koy ve `demo/assets/script.js` içindeki `.svg` uzantılarını `.jpg` yap. Logo için `demo/assets/images/logo.svg` dosyasını değiştir.

## Kendi alan adına bağlama

1. Depo kökünde `CNAME` adında bir dosya oluştur, içine sadece alan adını yaz (örnek: `kozalakbungalov.com`).
2. Alan adı sağlayıcında DNS kaydı ekle: `www` için `CNAME` kaydı `symnistaken.github.io` değerine; kök alan adı için GitHub'ın [A kayıtları](https://docs.github.com/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site).
3. Depoda **Settings → Pages** bölümünde alan adını doğrulayıp **Enforce HTTPS** seçeneğini aç.

## İletişim

Kozalak Bungalov: berkayseyman@gmail.com · [WhatsApp](https://wa.me/905340806421)

## Notlar

Site arayüzünün kökeni [CGhost1908/bungalow](https://github.com/CGhost1908/bungalow) projesidir; arayüz üzerindeki haklar sahiplerine aittir. Bu depodaki örnek görseller yer tutucudur.
