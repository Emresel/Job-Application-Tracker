# Projeyi Localhost'ta Çalıştırma

**Gereksinim:** Bilgisayarda **Node.js** yüklü olmalı (18 veya üzeri önerilir). [nodejs.org](https://nodejs.org) indir.

---

## Adım 1: Projeyi indir

GitHub'dan clone'la veya ZIP indirip aç:

```bash
git clone https://github.com/Emresel/Job-Application-Tracker
cd Job-Application-Tracker
```

---

## Adım 2: Client (React) – bağımlılıklar + build

**Terminal / CMD / PowerShell** aç, proje klasöründe:

```bash
cd client
npm install
npm run build
```

- `npm install` → paketleri yükler  
- `npm run build` → React uygulamasını derler (client/dist oluşur)

---

## Adım 3: Server (backend) – bağımlılıklar + çalıştır

Aynı proje köküne dön, server klasörüne gir:

```bash
cd ../server
npm install
npm run dev
```

- `npm install` → backend paketlerini yükler  
- `npm run dev` → sunucuyu başlatır (port 3000)

---

## Adım 4: Tarayıcıda aç

Sunucu çalışırken tarayıcıda aç:

**http://localhost:3000**

---

## Örnek giriş bilgileri

| Email | Şifre |
|-------|--------|
| admin@example.com | Admin123! |
| user@example.com | User123! |

---

## Windows’ta “script çalıştırma kapalı” hatası alırsan

PowerShell’de `npm run dev` çalışmıyorsa:

- **Seçenek 1:** **CMD (Komut İstemi)** aç, aynı komutları orada yaz.  
- **Seçenek 2:** PowerShell’i **Yönetici olarak** açıp şunu çalıştır:  
  `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`  
  Sonra tekrar `npm run dev`.

---

## Tek satırda özet (kopyala-yapıştır)

Proje klasöründeyken **iki aşamada** çalıştır:

```bash
cd client && npm install && npm run build
cd ../server && npm install && npm run dev
```

*(Windows CMD’de `&&` çalışır. PowerShell’de `&&` yerine `;` kullan: `cd client; npm install; npm run build`)*

Ardından tarayıcıda **http://localhost:3000** aç.
