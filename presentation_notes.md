# Job Application Tracker - Dönem Projesi Sunum Notları

Bu döküman, projenizi hocanıza Teams üzerinden sunarken kullanabileceğiniz teknik detayları ve önemli noktaları içermektedir. Hocaların en çok dikkat ettiği **Veritabanı Tasarımı**, **Güvenlik** ve **Mimari** başlıkları öne çıkarılmıştır.

## 1. Veritabanı ve Mimari (İlk Sorulacak Kısım)
Sunuma başlarken `server/schema.sql` dosyasını açıp üzerinden geçmeniz çok etkili olacaktır. Dosya içerisine akademik standartlara uygun yorum satırları eklenmiştir.

* **Relational Database (İlişkisel Veritabanı):** Projede SQLite kullanılmıştır (Hafif ve sunucu gerektirmediği için tercih edildi).
* **3NF (3rd Normal Form) Standardı:** Veri tekrarını önlemek için tablolar normalize edilmiştir. Örneğin `companies` (Şirketler) bilgisi, `applications` (Başvurular) tablosunda tekrar tekrar yazılmak yerine ayrı bir tabloya (`companyID` ile) alınarak 1:N ilişkisi kurulmuştur.
* **Foreign Key Constraints (Yabancı Anahtar Kısıtlamaları):** `PRAGMA foreign_keys = ON;` ile aktif edilmiştir. 
  * Örneğin bir başvuru (`applications`), mutlak bir kullanıcıya (`userID`) bağlıdır. 
  * Ayrıca silinme veya güncellenme durumlarındaki yetim(orphan) kayıtları önlemek için ilişkiler katı tutulmuştur.
* **Audit_Log (Denetim Kayıtları):** Sisteme güvenlik ve izlenebilirlik katmak için `audit_log` tablosu tasarlanmıştır. Yalnızca *Admin* rolü bu tabloyu okuyarak kimin ne zaman giriş yaptığını takip edebilir.

## 2. Güvenlik Önlemleri (Hocaların Beğeneceği Detaylar)
* **SQL Injection Koruması:** `server/index.js` içindeki tüm veritabanı sorguları *Parameterized Queries* (Parametrik Sorgular) ile yapılmıştır. Kullanıcıdan alınan veriler asla string birleştirme (concatenation) ile SQL içine yazılmaz, bu sayede SQL Injection saldırıları tamamen engellenmiştir.
* **Şifreleme (Bcrypt):** `users` tablosunda `password` yerine `passwordHash` tutulmaktadır. Kullanıcı şifreleri veritabanına kaydedilirken `bcryptjs` kütüphanesi kullanılarak geri döndürülemez şekilde şifrelenir (Salting + Hashing).
* **JWT (JSON Web Tokens) ile Authentication:** Kullanıcı giriş yaptığında (stateless) bir JWT token üretilir. Her API isteğinde (örn: başvuru listesini çekerken) sunucu bu token'ı doğrular (Authorization).
* **Brute-Force Koruması (Rate Limiting):** Login ve Register uç noktalarına (endpoint) `express-rate-limit` eklenmiştir. "15 dakika içinde 5 hatalı deneme" yapan bir IP adresi geçici olarak kilitlenir. Kaba kuvvet saldırıları (brute-force) engellenmiştir.
* **Role-Based Access Control (RBAC):** Admin, Management ve Regular User gibi roller tanımlanmıştır. API seviyesinde `requireRoles("Admin")` gibi middleware (ara yazılım) kontrolleri mevcuttur.

## 3. Frontend ve Teknolojiler
* **React (Vite) & TypeScript:** Modern, bileşen (component) tabanlı bir UI mimarisi kullanılmıştır. Durum yönetimi (State Management) için `Zustand` ve API istekleri için `React Query` tercih edilmiştir.
* **Tailwind CSS & Shadcn UI:** Temiz, duyarlı (responsive) tasarım ve hazır modüler UI bileşenleri entegre edilmiştir.

> **Tavsiye Edilen Sunum Akışı:**
> 1. Ekran paylaşımında önce projeyi tarayıcıda çalışır halde gösterin (Login, Dashoard, Yeni başvuru ekleme, Audit Log).
> 2. Ardından kod editörüne (VSCode) geçin ve *en çok önemsenen yer* olan `server/schema.sql` dosyasını açıp ilişkileri açıklayın.
> 3. `server/index.js` dosyasındaki `/api/v1/auth/login` kısmını gösterip şifrelerin nasıl doğrulandığını ve Brute-Force korumasını açıklayarak teknik bilginizi kanıtlayın.
