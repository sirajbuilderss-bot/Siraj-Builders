# Is update mein kya badla — Siraj Builders

Tareekh: 24 September 2026

---

## Sab se pehlay: DATABASE — jo error aa raha tha

Aap ne `page_sections` table delete kar di thi, isi liye admin panel ka
**Pages** screen yeh error de raha tha:

```
The page builder could not load
Could not find the table 'public.page_sections' in the schema cache
```

### Hal — 4 qadam, 1 minute

1. Supabase Dashboard → **SQL Editor** → **New query**
2. Yeh file **poori** copy karein:

   ```
   database/repair-page-sections.sql
   ```

3. Paste karein → **Run**
4. Admin panel refresh karein — **Ctrl + Shift + R**

Chalane ke baad SQL Editor ke **Messages** tab mein yeh dikhna chahiye:

```
page_sections repaired
  rows            : 91  (expected 91)
  distinct routes : 23  (expected 23)
```

### Poori install.sql kyun nahi?

Wo bhi chalegi — usme bhi sab kuch hai. Lekin ek table wapis laane ke liye
1,596 line ka SQL live database par chalana theek nahi lagta, aur usse dar
lagta hai ke kahin kuch aur na badal jaye.

`repair-page-sections.sql` sirf **503 line** hai aur **sirf** `page_sections`
table ko haath lagati hai. Yeh koi daawa nahi — build script har dafa check
karti hai ke is file mein kisi doosri table ka naam aaya to nahi. Aa jaye to
build hi fail ho jati hai.

| | |
|---|---|
| Kya banati hai | `page_sections` table + indexes + trigger + reorder function + RLS policies + 91 sections |
| Kis ko haath lagati hai | Sirf `page_sections` |
| Projects, services, FAQs, submissions, admin users | **Bilkul nahi chhoti** |
| Aap ka badla hua text | **Wapis nahi badlega** (`on conflict do nothing`) |
| Dobara chalana | Mehfooz hai |

### "schema cache" ka hissa

Kabhi aisa bhi hota hai ke table bana di jati hai lekin error phir bhi aata
hai. Uski wajah PostgREST (Supabase ka API) hai — wo schema ko cache karta
hai aur khud se dobara nahi parhta. Isi liye repair file ke aakhir mein yeh
line hai:

```sql
notify pgrst, 'reload schema';
```

Yehi cheez us doosre masle ko theek karti hai. Purani `install.sql` mein yeh
line thi lekin **seed aur policies se pehle** — ab file ke bilkul aakhir mein
hai, jahan iska asar hona chahiye.

---

## 0-B. Aage aisa dobara na ho — 3 cheezein theek keen

**1. `verify.sql` yeh masla pakar hi nahi sakti thi.** Wo 14 tables check
karti thi aur `page_sections` us list mein thi hi nahi. Matlab table delete
ho jane ke baad bhi verify.sql "sab OK" keh deti. Ab:

- Tables: 14 → **15** (`page_sections` shamil)
- RLS: 14 → **15**
- Policies: 30 → **32**
- Functions: 7 → **8** (`reorder_page_sections` shamil — yehi section
  reorder buttons chalata hai)
- **Naya check 10:** PAGE SECTIONS — 91 rows hain ya nahi
- **Naya check 11:** SECTION ROUTES — 23 pages ke sections hain ya nahi

Agar table ghayab ho to verify.sql ab seedha likh deti hai:
`MISSING TABLE — database/repair-page-sections.sql chalayein`

> Ek chhoti si technical baat: agar table ghayab ho to `select count(*) from
> public.page_sections` poori query ko parse error de kar rok deta. Matlab
> jis masle ko dhoondhne aaye thay wohi report na hota. Is liye ab ek chhota
> session-local helper hai jo pehle dekhta hai table hai bhi ya nahi.

**2. Admin panel ab khud bata deta hai.** Pehle wo raw PostgREST message
dikha deta tha — jo developer ko to samajh aa jata hai, lekin website chalane
wale ko kuch nahi batata. Ab Pages screen par poora tareeqa likha aata hai:
kaunsi file chalani hai, kahan chalani hai, baad mein kya karna hai, aur yeh
ke wo mehfooz hai. Raw error "Show technical detail" ke peeche chhupa hai.

Panel teen alag masle pehchanta hai aur teenon ka alag jawab deta hai:

| Masla | Kya kehta hai |
|---|---|
| Table ghayab | Repair file chalayein (poora tareeqa) |
| Login expire | Sign out kar ke dobara login karein |
| Internet/Supabase band | Connection check karein |

Ghalat mashwara na de — is liye login ya internet ke masle par wo SQL chalane
ko **nahi** kehta.

**3. Sidebar ab bhi chalta rahta hai.** Table ghayab ho to bhi poora menu
kaam karta hai — Dashboard, Projects, Services, Settings sab. Sirf sections
ki jagah ek chhoti si line aati hai: "Sections could not be loaded — See
why". Pehle poora navigation hi bekaar ho jata.

---

## 0-C. SQL ab generate hoti hai, haath se nahi likhi jati

`database/build-sql.js` ek hi source se **dono** files banati hai:

```bash
npm run build:sql
```

- `install.sql` — poora installer (schema + policies + seed)
- `repair-page-sections.sql` — sirf sections wala hissa

Dono ek hi source se bantay hain, is liye aapas mein kabhi farq nahi aa
sakta. Build fail ho jati hai agar file mein table create karna reh jaye,
parentheses balance na hon, ya repair file kisi doosri table ko chhoo le.

`install.sql` ke aakhir mein ab ek **FINAL CHECK** block bhi hai jo Messages
tab mein bata deta hai ke kitna data actually gaya:

```
SIRAJ BUILDERS — install complete
  page_sections rows : 91  (expected 91)
  distinct routes    : 23  (expected 23)
  pages rows         : 17  (expected 17)
```

Pehle SQL editor sirf "Success. No rows returned" likhta tha — jo tab bhi
likhta hai jab kuch hua hi na ho.

### SQL ki jaanch bina database ke

```bash
npm run verify        # JS + SQL dono
npm run verify:sql    # sirf SQL
```

Yeh check karta hai: dollar-quotes band hain, quotes aur brackets balanced
hain, har INSERT mein utni hi values hain jitne columns likhe hain, aur har
page ke sections seed hue hain.

Yeh checker khud bhi test kiya gaya: ek seed row se jaan boojh kar ek value
hatayi, to usne foran pakar liya —
`tuple 45 (~line 484) has 9 values but 10 columns were named`.

---

## 1. Admin ka left menu (sidebar) — poora naya

### Pehlay kya masla tha

Kisi bhi text ko badalnay ke liye teen dafa dhoondhna parta tha:
Page builder kholo → page dhoondho → section dhoondho. Sidebar se yeh pata hi
nahi chalta tha ke sections mojood bhi hain.

### Ab kya hai

```
Website
  Pages  ▾              ← chevron (teer) — isay dabayein
    Home  ▸             ← mouse le jaayein ya dabayein
      Hero Section      ← click — editing form foran khul jata hai
      Introduction
      Services Section
      Statistics Band   (hidden)
    About ▸
    Services ▸
    … website ke saray 23 pages
```

- **Pages** ke saath dropdown ka nishan (chevron) lag gaya hai.
- Kholnay par **website ke saray pages** aa jaate hain, apnay group ke saath
  (Main / Services / Company).
- Kisi bhi page par **mouse le jaanay ya click karne se us ke saray sections**
  ek dropdown mein khul jaate hain.
- Section par click karte hi **seedha us ka editing form khul jata hai** —
  darmiyan mein koi qadam nahi.
- **Yeh har page ke liye chalta hai**, sirf Home ke liye nahi.

### Chotay chotay kaam ki baatein

| Cheez | Kya hoti hai |
|---|---|
| `2/3` | 3 sections hain, 2 website par live hain |
| `—` | Is page ka abhi koi section nahi |
| **hidden** label | Section mojood hai lekin website par nahi dikh raha |
| Search box | 12 se ziyada sections hon to khud aa jata hai |
| **Collapse all** | Sab branches ek saath band |

- Aap ne jo branches khol rakhi thin wo **agli dafa bhi khuli milengi**
  (browser mein mehfooz rehti hain).
- Mouse hatane par dropdown **band nahi hota** — yeh jaan boojh kar kiya gaya
  hai. Jo menu cursor ke neechay se khud band ho jaate hain wo sab se
  takleef-deh hotay hain. Band karne ke liye dobara click karein.
- Har menu item ke saath ab **icon** hai.
- Neechay signed-in user ka naam aur role sahi tareeqay se dikhta hai.

### Aur bhi

- Ab section khulnay par **browser ka address badal jata hai**. Iska matlab:
  - Wo address kisi ko bhej dein to un ka **wohi section** khulay ga.
  - **Back button** theek chalta hai.
  - Bookmark kar saktay hain.
- Section ka form band karne par us ki line **highlight** rehti hai, taake
  lambi list mein yeh na bhoolein ke aap kahan thay.
- Sidebar aur Page builder ab **ek hi data** parhtay hain — section save karne
  par dono foran update ho jaate hain.

### Menu ke naam

| Pehlay | Ab |
|---|---|
| Page builder | **Pages** (dropdown ke saath) |
| Pages | **Page copy** |

Naam is liye badle taake jo cheez sab se ziyada istemal hoti hai us ka naam
seedha saada ho. Kaam dono ka wohi hai.

---

## 2. Home page ka hero section — arrows theek kiye

### Asal masla

Jo "arrows" thay wo **arrows thay hi nahi** — wo `→ ← ▶ ❙❙` likhay huay
**text characters** thay. Natija:

- Har computer/phone par **alag shakal aur alag motai** — jo font us device
  par hota, wohi shakal aa jaati.
- `❙❙` (pause ka nishan) kai fonts mein hota hi nahi — bohat se users ko
  wahan **do khaali dabbay (□□)** nazar aate thay.
- Text hamesha apni lakeer (baseline) par baithta hai, is liye gol 52px ke
  button ke **theek beech mein kabhi aata hi nahi tha**.
- Screen reader button ke naam ke beech "rightwards arrow" parh deta tha.

### Ab

- Saray arrows asli **SVG icons** hain (`src/components/ui/Icons.jsx`).
  Har device par bilkul ek jaisi shakal.
- Button ke **theek beech** mein aate hain.
- Hover par arrow apni simt mein halka sa sarakta hai.
- Pause/Play ke asli icons — koi khaali dabba nahi.
- Dots, counter (`01 — 04`) aur pause ab ek hi group mein beech mein hain.
  Pehlay pause button barri screen par kinaray chala jata tha.
- **Phone par swipe** kaam karta hai — ungli se dayein-bayein karein.
- Screen reader ke liye khamoshi se elaan hota hai ke kaunsa slide chal raha
  hai.
- Chhoti screen par arrows 44px ke rehtay hain (ungli ke liye sahi size) aur
  counter chhup jata hai taake line tang na ho.
- Jin logon ne phone/computer mein "reduce motion" on kiya ho, un ke liye
  saari harkat band.

---

## 3. Testing

Is baar ka kaam khali "likh diya" nahi hai — verify kiya gaya hai:

| Test | Nateeja |
|---|---|
| Poora app bundle hota hai (saray imports resolve) | ✅ |
| 84 files ki JSX syntax | ✅ |
| Saray CSS files ke braces balanced | ✅ |
| 23 page-builder routes App.jsx se match kartay hain | ✅ |
| 9 SQL files — quotes, brackets, INSERT column counts | ✅ |
| Har route ke sections seed hain | ✅ 23/23 |
| repair file sirf page_sections ko chhooti hai | ✅ |
| Components asal mein render hotay hain (44 checks) | ✅ 44/44 |

Do naye test files daal diye gaye hain taake aap khud bhi chala sakein:

```bash
npm test
```

- `src/hero.test.js` — 12 tests. Ek test khaas taur par **fail ho jaye ga
  agar kabhi koi text arrow (`→`) wapis aa gaya.**
- `src/admin-navigation.test.js` — 18 tests. Sidebar ka tree, sections ka
  dropdown, hidden sections, aur deep-link se editor khulna.
- `src/database-setup.test.js` — 11 tests. Wohi error jo aap ko aaya tha
  (verbatim), sahi pehchana jata hai ya nahi; repair file ka naam screen par
  aata hai ya nahi; aur table ghayab hone par sidebar zinda rehta hai ya nahi.

---

## Files jo badle

**Naye:**

- `src/components/ui/Icons.jsx` — website ke SVG arrows
- `src/admin/components/icons.jsx` — admin ke 19 SVG icons
- `src/admin/components/AdminSidebar.jsx` — naya sidebar + tree
- `src/admin/SiteMapContext.jsx` — sidebar aur builder ka mushtarak data
- `src/admin/components/SetupNotice.jsx` — database error ka asal hal
- `src/hero.test.js`, `src/admin-navigation.test.js`,
  `src/database-setup.test.js` — tests
- `database/build-sql.js` — install.sql aur repair file dono generate karti hai
- `database/repair-page-sections.sql` — **jo aap ko abhi chalani hai**
- `scripts/verify-sql.js` — SQL ki jaanch
- `WHAT-CHANGED.md` — yeh file

**Badle huay:**

- `src/components/home/HeroSlider.jsx`
- `src/admin/AdminApp.jsx`
- `src/admin/pages/PageBuilderPage.jsx`
- `src/admin/SiteMapContext.jsx` — `diagnose()` add hui
- `src/styles/home.css`, `src/styles/admin.css`, `src/styles/global.css`,
  `src/styles/theme.css`
- `database/install.sql` — ab final check block ke saath
- `database/verify.sql` — page_sections ke checks add huay
- `package.json` — `verify`, `verify:sql`, `build:sql` scripts
- `SETUP-GUIDE-URDU.md` — repair ka tareeqa
- `ADMIN_GUIDE_ROMAN_URDU.md` — teen naye hissay (8-A menu ka naqsha, 8-B
  sidebar se section tak, aur Pages error ka hal)

---

## Chalane ka tareeqa

```bash
npm install
npm start          # dev server
npm test           # tests (41 total)
npm run verify     # JS + SQL checks, bina database ke
npm run build      # production build
```

Aur sab se pehle: Supabase mein `database/repair-page-sections.sql` chalayein.

Deploy karne se pehlay `npm run build` zaroor chala lein.
