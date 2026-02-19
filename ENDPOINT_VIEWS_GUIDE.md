# Endpoint'leri Nasıl Anlatıp Göstereceğim?

**Dosya:** `server/index.js`  
**Kısayol:** VS Code'da **Ctrl+G** → satır numarası yaz → Enter (o satıra gider)

---

## 1. Genel yapı (başta göster)

- **Satır 17:** `const API_PREFIX = "/api/v1";`  
  **Söyle:** "Tüm API'ler /api/v1 altında; prefix burada tanımlı."

- **Satır 178–198:** `authOptional` ve `authRequired` + `signToken`  
  **Söyle:** "Token'ı Authorization header'dan okuyorum; geçerliyse req.user dolduruluyor. Korumalı route'lar authRequired kullanıyor."

---

## 2. Auth endpoint'leri (view 1)

**Satır 252–289** → **Ctrl+G** ile **253** yaz.

| Satır | Ne var | Anlat |
|-------|--------|--------|
| 253 | GET /health | "Sunucu sağlık kontrolü; basit bir ok dönüyor." |
| 256–273 | POST /auth/register | "Kayıt: name, email, password alıyorum. Şifreyi bcrypt ile hash'leyip users tablosuna yazıyorum." |
| 276–289 | POST /auth/login | "Login: email ve şifre kontrolü, bcrypt.compare. Geçerliyse signToken ile JWT üretip dönüyorum." |

**Söyle:** "Auth için iki endpoint: register ve login. Login'de JWT dönüyorum; frontend bunu saklayıp her istekte gönderiyor."

---

## 3. Users endpoint'leri (view 2)

**Satır 291–329** → **Ctrl+G** ile **293** yaz.

| Satır | Ne var | Anlat |
|-------|--------|--------|
| 293–299 | GET /users/me | "Giriş yapan kullanıcının kendi bilgisi; authRequired ile korumalı." |
| 304–311 | GET /users | "Tüm kullanıcı listesi; sadece Admin, requireRoles('Admin')." |
| 314–328 | PUT /users/:id | "Kullanıcı rolü güncelleme; yine sadece Admin." |

**Söyle:** "Users tarafında /me ile kendi profilim, Admin için tüm kullanıcı listesi ve rol güncelleme var."

---

## 4. Companies & Categories (view 3)

**Satır 331–401** → **Ctrl+G** ile **333** yaz.

| Satır | Ne var | Anlat |
|-------|--------|--------|
| 333–335 | GET /companies | "Şirket listesi; herkes görebilir." |
| 338–347 | POST /companies | "Şirket ekleme; Admin veya Management, hasRole kontrolü." |
| 352–401 | GET/POST/PUT/DELETE /categories | "Kategoriler CRUD; listeleme authOptional, create/update/delete Admin veya Management." |

**Söyle:** "Companies ve categories için REST CRUD var; yetki kontrolü role göre."

---

## 5. Applications – en önemli view (view 4)

**Satır 403–630** → **Ctrl+G** ile **404** yaz.

| Satır | Ne var | Anlat |
|-------|--------|--------|
| 404–508 | GET /applications | "Listeleme: page, pageSize, status, companyID, categoryID, q (arama), sort. Giriş yoksa örnek veri dönüyorum; giriş varsa kullanıcının kendi başvuruları. Admin/Management global görebilir." |
| 512–549 | POST /applications | "Yeni başvuru; authRequired + JobSeeker. Body'den company, position, status, appliedDate alıyorum; application_history'ye ilk kaydı ekliyorum." |
| 553–614 | PUT /applications/:id | "Güncelleme; sadece sahibi veya Admin/Management. Status değişirse history'ye yeni satır." |
| 616–624 | DELETE /applications/:id | "Silme; aynı yetki kuralı. Önce history ve reminders'dan ilgili kayıtları siliyorum." |
| 630+ | GET /applications/export.csv | "CSV export; giriş gerekli." |

**Söyle:** "Applications ana modül. GET'te sayfalama, filtreleme ve sıralama var; POST/PUT/DELETE'te yetki kontrolü ve audit."

---

## 6. Reminders (view 5)

**Satır 693–738** → **Ctrl+G** ile **695** yaz.

| Satır | Ne var | Anlat |
|-------|--------|--------|
| 695–705 | GET /reminders | "Kullanıcının kendi hatırlatıcıları." |
| 707–726 | POST /reminders | "Yeni hatırlatıcı; appID, reminderDate, message." |
| 728–737 | DELETE /reminders/:id | "Hatırlatıcı silme." |

**Söyle:** "Reminders kullanıcı bazlı; her kullanıcı sadece kendi kayıtlarını görüyor ve yönetiyor."

---

## 7. Dashboard (view 6)

**Satır 740–850 civarı** → **Ctrl+G** ile **741** yaz.

| Satır | Ne var | Anlat |
|-------|--------|--------|
| 741–782 | GET /dashboard | "Özet: toplam başvuru, mülakat sayısı, teklif, red. Giriş yoksa örnek sayılar; giriş varsa gerçek COUNT sorguları." |
| 786–810 | GET /dashboard/status-breakdown | "Status'e göre adet; GROUP BY status." |
| 814–848 | GET /dashboard/timeseries | "Tarih bazlı seri; from, to query param ile. Grafik için." |

**Söyle:** "Dashboard üç endpoint: özet metrikler, status dağılımı, zaman serisi. Guest için sample data dönüyorum."

---

## Sunumda sıra önerisi

1. **API_PREFIX + auth middleware** (17, 178–198) – "Tüm route'lar ve koruma böyle."
2. **Auth** (253–289) – "Login/register ve JWT."
3. **Applications GET + POST** (404–549) – "En kritik kısım: listeleme ve ekleme."
4. **Dashboard** (741–782) – "Özet istatistikler nasıl üretiliyor."

İstersen sadece 2 ve 3'ü detaylı gösterip diğerlerini "Users, companies, categories, reminders de aynı mantıkla CRUD" diye özetleyebilirsin.
