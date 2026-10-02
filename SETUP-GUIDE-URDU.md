# Siraj Builders — Setup Guide (Roman Urdu)

Yeh guide aap ko zero se lay kar chalti hui website tak le jayegi.
Kul waqt: **taqreeban 10 minute.**

English guide ke liye `README.md` dekhein.

---

## Pehle yeh samajh lein — 2 minute

Aap ke paas 2 alag cheezein hain:

| Cheez | Kahan hai | Kya karti hai |
|---|---|---|
| **Website ka code** | ZIP file mein, aap ke computer par | Screens dikhata hai |
| **Database** | Supabase par, internet par | Data mehfooz rakhta hai |

Abhi tak Supabase par **koi table nahi bani**. Is liye pehla kaam tables banana hai.

Jab tak tables nahi banti:
- Website chalegi, khulegi, dikhegi — lekin content code ke andar se aayega
- Admin panel khulega lekin **login nahi hoga**
- Forms submit **nahi** honge

Yeh normal hai. Neeche wale steps se sab theek ho jayega.

---

## NAYA RELEASE — pehle yeh parhein

**Agar aap ne pehle kabhi `install.sql` nahi chalaya** (bilkul naya Supabase
project): neeche STEP 1 follow karein — `install.sql` mein ab sab kuch hai
(tables, photos ka storage, aur documentation wala poora content).

**Agar aap pehle `install.sql` chala chuke hain** (purana database maujood
hai): `install.sql` dobara chalane ki zaroorat nahi. SQL Editor mein sirf yeh
do files, isi tarteeb se, chalayein:

1. `database/migration-02-cms.sql` — project ki tasveerein/videos ki table,
   SEO fields, aur upload ke liye storage bucket
2. `database/migration-03-content.sql` — har page ka documentation wala
   content, 20 FAQs, services ke cards

Dono files mehfooz hain: dobara chalane se kuch kharab nahi hota, aur jo
cheez aap ne admin panel se badli hai wo **nahi** badle gi.

Tables ki poori tafseel: `database/SCHEMA.md`.

---

## STEP 1 — Supabase mein tables banayein

### 1.1 — Supabase kholein

Browser mein jayein: **https://supabase.com/dashboard**

Login karein aur apna project kholein (`hmpeamtudxwkiobevwgu`).

### 1.2 — SQL Editor kholein

Left side ke menu mein **SQL Editor** par click karein
(icon `</>` jaisa dikhta hai).

Phir upar **"+ New query"** par click karein.

### 1.3 — Installer file copy karein

ZIP extract karne ke baad yeh file kholein:

```
siraj-builders/database/install.sql
```

Kis cheez se kholein: Notepad, VS Code, ya koi bhi text editor.

**Poori file select karein** — `Ctrl + A` dabayein — phir `Ctrl + C` se copy karein.

> Yeh file 69 KB ki hai. Poori copy honi chahiye, aadhi nahi.
> Neeche scroll kar ke confirm karein ke aakhir tak select hui hai.

### 1.4 — Paste aur Run

Supabase ke SQL Editor ke khaali box mein `Ctrl + V` se paste karein.

Phir neeche daayein taraf **"Run"** ka green button dabayein
(ya keyboard se `Ctrl + Enter`).

**15 se 30 second intezaar karein.** File barri hai.

### 1.5 — Natija

Neeche **"Success. No rows returned"** likha aa jaye to kaam ho gaya.

Agar **red error** aaye to ghabrayein nahi — Supabase sab kuch ek hi
transaction mein chalata hai, matlab error aane par kuch bhi save nahi hota.
Database waise ka waisa rehta hai. Error ka pura message copy kar ke
mujhe bhej dein.

---

## STEP 2 — Check karein ke sab theek bana

SQL Editor mein dobara **"+ New query"** par click karein.

Ab yeh file copy-paste karein:

```
siraj-builders/database/verify.sql
```

**Run** dabayein. Aap ko aisa table nazar aayega:

| step | check_name | found | expected | status |
|---|---|---|---|---|
| 1 | TABLES | 14 | 14 | OK |
| 2 | RLS ENABLED | 14 | 14 | OK |
| 3 | POLICIES | 30 | 30 | OK |
| 4 | FUNCTIONS | 7 | 7 | OK |
| 5 | PAGES | 17 | 17 | OK |
| 6 | SERVICES | 7 | 7 | OK |
| 7 | FAQS | 19 | 19 | OK |
| 8 | SETTINGS | 13 | 13 | OK |
| 9 | HERO SLIDES | 4 | 4 | OK |
| 10 | ADMIN USERS | 0 | 0 | KHALI — ab signup karein |

**Step 1 se 9 tak sab "OK" hona chahiye.**

**Step 10 ka "KHALI" bilkul sahi hai** — abhi koi admin account nahi bana.
Woh hum Step 4 mein banayenge.

### Step 2 par khaas tawajjo dein

Agar **RLS ENABLED** par `KHATRA` likha aaye, to rukein aur aagay na barhein.
Iska matlab hai ke security rules nahi lagay. Aisi surat mein anon key se
koi bhi aap ka pura database parh sakta hai — submissions samet.
`install.sql` dobara chalayein.

---

## STEP 3 — Website chalayein

Ab apne computer par terminal / command prompt kholein.

```bash
cd siraj-builders
npm install
npm run dev
```

`npm install` pehli baar 2 se 4 minute le sakta hai. Sabar karein.

Browser khud khul jayega: **http://localhost:3000**

Website ab database se content utha rahi hai.

---

## STEP 4 — Apna admin account banayein

### 4.1 — Pehle email confirmation band karein (recommended)

Supabase Dashboard mein jayein:

**Authentication** → **Providers** → **Email**

**"Confirm email"** ko **OFF** kar dein, phir **Save** dabayein.

Aisa kyun? Warna signup ke baad Supabase email bhejega aur aap ko
email kholne parega. Setup ke waqt yeh faltu ka chakkar hai.

> Website launch karne se pehle isay wapas ON kar dein.

### 4.2 — Signup karein

Browser mein jayein:

```
http://localhost:3000/admin/signup
```

Yeh form bharein:
- **Full name** — apna naam
- **Email** — apna email
- **Password** — kam az kam 8 characters
- **Confirm password** — wahi password dobara

**"Create account"** dabayein.

### 4.3 — Aap admin ban gaye

Screen par likha aayega: **"You are the administrator"**

**Yeh sirf ek baar hota hai.** Jo sab se pehla account banta hai wahi
administrator banta hai. Uske baad jo bhi signup karega uska account
**inactive** rahega jab tak aap khud usay approve na karein.

Yeh jaan boojh kar aisa banaya gaya hai. Supabase ka anon key website
ke code mein hota hai — koi bhi usay page ke source se parh sakta hai.
Agar signup form khud access de deta, to admin panel har kisi ke liye
khul jata. Is liye faisla Postgres ke andar hota hai, browser mein nahi.

---

## STEP 5 — Sab kuch test karein

### Test 1 — Admin panel

```
http://localhost:3000/admin
```

Dashboard khulna chahiye. Left side mein yeh sections honge:

| Section | Kya manage hota hai |
|---|---|
| Dashboard | Total submissions, projects, services, recent activity |
| Submissions | Website se aane wali enquiries — search, filter, delete, PDF export |
| Projects | Portfolio — add, edit, delete, enable/disable |
| Services | Services — add, edit, delete |
| Pages | 17 pages ka text |
| FAQs | Sawal jawab |
| Testimonials | Client ke comments |
| Team | Leadership page ke members |
| Hero slides | Homepage ka slider |
| Statistics | Homepage ke numbers |
| Settings | Phone, email, address, social links, footer |
| Admin users | Naye signups approve karna, role badalna |

### Test 2 — Contact form

```
http://localhost:3000/contact-us
```

Form bhar kar submit karein. **"Thank you"** message aana chahiye.

Ab admin panel → **Submissions** kholein. Aap ki entry wahan honi chahiye.

### Test 3 — Consultation form

```
http://localhost:3000/consultation
```

Yahan bhi wahi karein. Yeh bhi Submissions mein aani chahiye,
lekin uska type "consultation" hoga.

### Test 4 — PDF export

Admin panel → **Submissions** → kisi entry par **Export PDF** dabayein.

PDF download honi chahiye.

Aap chahein to sab entries select kar ke ek saath bhi export kar sakte hain.

### Test 5 — Content badalna

Admin panel → **Settings** → phone number badlein → **Save** dabayein.

Ab website ka footer kholein. Naya number wahan dikhna chahiye.

**Yahi is pure kaam ka maqsad hai** — ab content badalne ke liye code
ko haath lagane ki zaroorat nahi.

---

## Konsi table kya karti hai

| Table | Kaam |
|---|---|
| `admin_users` | Kaun admin panel mein aa sakta hai |
| `submissions` | Contact aur consultation forms ka data |
| `projects` | Portfolio / case studies |
| `services` | Services list |
| `pages` | 17 pages ka text |
| `faq_categories` | FAQ ke categories |
| `faqs` | Sawal jawab |
| `testimonials` | Client ke comments |
| `team_members` | Leadership page |
| `stats` | Homepage ke numbers |
| `hero_slides` | Homepage slider |
| `site_settings` | Phone, email, address, footer, SEO |
| `social_links` | Facebook, Instagram waghera |
| `activity_logs` | Kis admin ne kya badla — audit trail |

---

## Masail aur unka hal

### "Supabase is not configured"

`.env` file parhi nahi ja rahi.

`.env` file ZIP mein pehle se mojood hai aur bhari hui hai. Check karein:
- Woh `siraj-builders/` folder mein hai (`src/` ke andar nahi)
- Naam sirf `.env` hai — `.env.txt` nahi

Phir dev server band kar ke (`Ctrl + C`) dobara `npm run dev` chalayein.
CRA `.env` sirf start hote waqt parhta hai.

### "The page builder could not load" / "Could not find the table 'public.page_sections' in the schema cache"

Yeh admin panel ke **Pages** screen par aata hai. Matlab saaf hai:
`page_sections` table database mein mojood nahi. Yehi table website ke har
page ke saray sections rakhti hai (kul **91 sections, 23 pages**), is liye
Pages screen ke paas dikhane ko kuch nahi bachta.

**Hal — 4 qadam:**

1. Supabase Dashboard → **SQL Editor** → **New query**
2. Yeh file poori copy karein:

   ```
   siraj-builders/database/repair-page-sections.sql
   ```

3. Paste karein aur **Run** dabayein
4. Admin panel mein wapis aayein aur **Ctrl + Shift + R** se refresh karein

**Yeh file mehfooz hai:**

- Sirf `page_sections` table ko haath lagati hai. Projects, services, FAQs,
  testimonials, submissions, admin users — kisi ko nahi chhoti.
- Agar table pehle se mojood ho to dobara nahi banati.
- Rows `on conflict do nothing` se aati hain — matlab **jo text aap ne admin
  panel se badla hoga wo wapis nahi badle ga**.
- Dobara chalana bhi mehfooz hai.

Chalane ke baad SQL Editor ke **Messages** tab mein yeh nazar aana chahiye:

```
page_sections repaired
  rows            : 91  (expected 91)
  distinct routes : 23  (expected 23)
```

> **Agar table mojood hai phir bhi yehi error aa raha hai:** to masla
> PostgREST ka schema cache hai — API ko abhi tak nayi table ka pata nahi
> chala. `repair-page-sections.sql` ke aakhir mein `notify pgrst, 'reload
> schema';` hai jo yehi theek karta hai, is liye file phir bhi chalayein.

### "This account is not authorised for the admin panel"

Aap ka Supabase Auth account to ban gaya lekin `admin_users` mein row nahi bani.

Sab se aam wajah: `install.sql` nahi chala. `verify.sql` chala kar dekhein —
agar FUNCTIONS "MISSING" hai to `install.sql` chalayein.

### "This account is waiting for approval"

Aap ke project mein pehle se ek admin maujood hai. Aap ka account ban gaya
hai lekin inactive hai.

Purane admin account se login kar ke **Admin users** → **Approve** dabayein.

### Form submit nahi ho raha

Browser mein `F12` daba kar **Console** tab dekhein.

- `relation "public.submissions" does not exist` → `install.sql` nahi chala
- `new row violates row-level security policy` → `policies.sql` nahi chala

Dono soorat mein `install.sql` dobara chalayein.

### Website khaali dikh rahi hai / content nahi aa raha

`verify.sql` chalayein. Agar PAGES, SERVICES, FAQS par "MISSING" ho
to seed data nahi gaya. `install.sql` dobara chalayein.

### Password reset email nahi aa rahi

Supabase ka apna email sender sirf testing ke liye hai aur bohat
rate-limited hai. Client ko dene se pehle apna SMTP lagayein:

**Project Settings** → **Authentication** → **SMTP Settings**

Saath hi apna production URL yahan add karein, warna reset links
reject ho jayenge:

**Authentication** → **URL Configuration** → **Redirect URLs**

---

## Ek aham baat — security

Aap ka **anon key** website ke JavaScript bundle mein jata hai.
Har visitor usay page source se parh sakta hai. **Yeh normal hai** —
woh key sirf project pehchanti hai, permission nahi deti.

Aap ka data **Row Level Security** se mehfooz hai, jo `policies.sql`
se lagti hai. Is liye woh file chalana zaroori hai.

**Kabhi bhi `service_role` key is project mein na dalein.** Woh key
saari security rules ko bypass kar deti hai. Woh sirf server par
istemaal hoti hai, browser mein kabhi nahi.

---

## Ab kya karein

Tables ban gayin, website chal rahi hai, aap admin hain.

Ab `TO-CONFIRM.md` file kholein. Us mein woh saari business details likhi
hain jo abhi tak confirm nahi huin — phone, email, office address, service
areas, asli projects, verified testimonials.

Woh sab ab admin panel se add ho sakti hain. Code ko haath lagane ki
zaroorat nahi.
