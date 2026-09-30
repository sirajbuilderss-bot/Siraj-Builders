# Siraj Builders — Admin Panel Guide (Roman Urdu)

Yeh guide un logon ke liye hai jo website ka content manage karenge.
Koi coding ki zaroorat nahi hai. Sirf browser chahiye.

> **Sab se pehle yaad rakhein:** aap jo bhi change karte hain, wo **foran**
> website par chala jata hai. Agar aap sure nahi hain, to change karne se
> pehle "Hide" ka option istemal karein — us se cheez delete nahi hoti,
> sirf visitors ko nazar nahi aati.

---

## Fehrist (Contents)

1. [Admin login kaisay karna hai](#1-admin-login-kaisay-karna-hai)
2. [Password reset kaisay karna hai](#2-password-reset-kaisay-karna-hai)
3. [Project add kaisay karna hai](#3-project-add-kaisay-karna-hai)
4. [Project edit kaisay karna hai](#4-project-edit-kaisay-karna-hai)
5. [Project delete kaisay karna hai](#5-project-delete-kaisay-karna-hai)
6. [Services manage kaisay karni hain](#6-services-manage-kaisay-karni-hain)
7. [Forms ka data kahan dikhe ga](#7-forms-ka-data-kahan-dikhe-ga)
8. [PDF export kaisay karni hai](#8-pdf-export-kaisay-karni-hai)
8-A. [Left menu (sidebar) ka naqsha](#8-a-left-menu-sidebar-ka-naqsha)
8-B. [Sidebar se seedha section tak pohanchna (NAYA)](#8-b-sidebar-se-seedha-section-tak-pohanchna-naya)
9. [New section add kaisay karna hai](#9-new-section-add-kaisay-karna-hai)
10. [Existing section remove kaisay karna hai](#10-existing-section-remove-kaisay-karna-hai)
11. [Home page edit kaisay karna hai](#11-home-page-edit-kaisay-karna-hai)
12. [About page edit kaisay karna hai](#12-about-page-edit-kaisay-karna-hai)
13. [Contact page edit kaisay karna hai](#13-contact-page-edit-kaisay-karna-hai)
14. [Image URL kaisay add karna hai](#14-image-url-kaisay-add-karna-hai)
15. [Video URL kaisay add karna hai](#15-video-url-kaisay-add-karna-hai)

---

## 1. Admin login kaisay karna hai

1. Browser kholein.
2. Address bar mein apni website ka address likhein, aur aakhir mein `/admin`
   lagayein. Misal ke taur par:

   ```
   https://sirajbuilders.com/admin
   ```

3. Login screen khulay gi. Usme do khanay honge:
   - **Email** — apna email likhein
   - **Password** — apna password likhein
4. **Sign in** button dabayein.
5. Login hone ke baad aap **Dashboard** par pahunch jayenge.

**Pehli dafa istemal kar rahay hain?**
Agar abhi tak kisi ka account nahi bana, to `/admin/signup` par jaa kar account
banayein. **Sab se pehla account khud-ba-khud owner ban jata hai** aur usay
poora control milta hai.

Uske baad jo bhi signup karay ga, uska account **pending** rahay ga. Owner ko
`Admin users` wale page par jaa kar usay **active** karna hoga. Yeh jaan boojh
kar aisa rakha gaya hai — taake koi ajnabi khud se admin na ban sakay.

**Login nahi ho raha?**

| Masla | Hal |
|---|---|
| "Invalid credentials" | Email ya password ghalat hai. Caps Lock check karein. |
| "Your account is not active" | Owner se kahein ke wo aap ka account active karay. |
| Page khali aa raha hai | Internet check karein, phir page refresh karein (Ctrl+R). |

---

## 2. Password reset kaisay karna hai

Agar password bhool gaye hain:

1. Login page par **Forgot password?** par click karein.
2. Apna email likhein aur **Send reset link** dabayein.
3. Apna **email inbox** kholein. Ek email aaye gi jisme ek link hoga.
   - Email na milay to **Spam / Junk** folder zaroor dekh lein.
4. Us link par click karein.
5. Naya password do dafa likhein (dono ek jaisay honay chahiye).
6. **Update password** dabayein.
7. Ab naye password se login karein.

> **Note:** Reset link thori dair ke liye hi kaam karta hai. Agar der ho jaye
> aur link expire ho jaye, to koi masla nahi — dobara step 1 se shuru kar dein.

**Acha password kaisa hota hai:** kam az kam 8 characters, jisme bara haraf,
chota haraf aur number shaamil ho. Apna naam ya `12345678` jaisa password na
rakhein.

---

## 3. Project add kaisay karna hai

1. Left side wale menu se **Projects** par click karein.
2. Upar dayein taraf **Add Project** button dabayein.
3. Form khulay ga. Yeh khanay bharein:

**Zaroori khanay:**

| Khana | Kya likhna hai | Misal |
|---|---|---|
| Project name | Project ka naam | `Model Town Residence` |
| URL slug | Chote haroof, space ki jagah dash | `model-town-residence` |
| Category | Residential / Commercial / Renovation / Design & Build | `Residential` |

**Baqi khanay (marzi se):**

| Khana | Kya likhna hai |
|---|---|
| Status | `Completed` ya `Ongoing` |
| Client name | Client ka naam — **sirf us ki ijazat se** |
| Location | Sheher ya ilaqa |
| Completion date | Project kab mukammal hua |
| Year | Saal, jaisay `2025` |
| Area | `10 marla` ya `2,400 sq ft` |
| Sort order | Chota number pehlay aata hai (0, 1, 2…) |
| Thumbnail URL | Card wali tasveer ka link — [dekhein point 14](#14-image-url-kaisay-add-karna-hai) |
| Banner URL | Project page ke upar wali bari tasveer |
| Video URL | YouTube ya Vimeo ka link — [dekhein point 15](#15-video-url-kaisay-add-karna-hai) |
| Gallery URLs | Har line par ek image link |
| Short description | 40–60 lafz. Card par yehi nazar aata hai |
| Full description | Project page ka shuru wala hissa |
| Features | Har line par ek feature |
| Tags | Comma se alag karein: `turnkey, 10 marla, Narowal` |
| Client requirement | Client ko kya chahiye tha |
| Challenge | Project mein kya mushkil thi |
| Our approach | Aap ne kaisay kiya |
| Result | Aakhir mein kya mila |

4. Agar project ko sab se upar dikhana hai to **Feature this project** par
   tick lagayein.
5. **Show on the live site** par tick laga hua chorein (agar abhi public nahi
   karna, to tick hata dein).
6. **Save** dabayein.

> **Tip:** Project adhoora hai? Koi baat nahi. **Show on the live site** ka
> tick hata kar save kar dein. Kaam mehfooz rahay ga lekin website par nahi
> dikhe ga. Jab tayyar ho jaye, tick laga dein.

---

## 4. Project edit kaisay karna hai

1. Menu se **Projects** par jayein.
2. Jo project badalna hai usay list mein dhoondein.
   - Bohat saray projects hain? Upar **search box** mein naam likh kar dhoondein.
3. Us project ki line ke aakhir mein **Edit** dabayein.
4. Jo khana badalna hai, badal dein.
5. **Save** dabayein.

Change foran website par chala jata hai. Confirm karne ke liye upar
**View website** dabayein aur project page kholein.

---

## 5. Project delete kaisay karna hai

> **Rukiye.** Delete ka matlab hamesha ke liye khatam. Wapis nahi aata.
>
> Agar aap sirf yeh chahtay hain ke project website par na dikhay, to
> **delete na karein** — Edit kholein aur **Show on the live site** ka tick
> hata dein. Data mehfooz rahay ga.

Agar waqai delete karna hai:

1. **Projects** par jayein.
2. Project ki line mein **Delete** dabayein.
3. Ek confirmation box khulay ga. Usay parhein.
4. **Delete** dabayein.

---

## 6. Services manage kaisay karni hain

Services wo kaam hain jo aap karte hain — Residential Construction,
Commercial Construction, waghera.

**Nayi service add karna:**

1. Menu se **Services** par click karein.
2. **Add Service** dabayein.
3. Bharein:
   - **Title** — service ka naam
   - **Slug** — chote haroof, dash ke saath
   - **Summary** — do teen line ki tafseel
   - **Icon / Image URL** — marzi se
   - **Sort order** — kis number par dikhe
4. **Save** dabayein.

**Service edit karna:** line mein **Edit** → badlein → **Save**.

**Service chupana:** Edit kholein → **Show on the live site** ka tick hatayein
→ Save. (Delete se behtar hai — baad mein wapis on kar saktay hain.)

**Service delete karna:** line mein **Delete** → confirm karein.

---

## 7. Forms ka data kahan dikhe ga

Jab koi visitor website par form bhare ga — Contact form ya Consultation
form — to us ka data **Submissions** page par aa jata hai.

1. Menu se **Submissions** par click karein.
2. Poori list nazar aaye gi — sab se nayi sab se upar.
3. Kisi bhi line par click karein — poori tafseel khul jaye gi:
   - Naam, phone, email
   - Project type aur location
   - Budget aur start date
   - Poora message

**Kaam ki cheezein:**

| Kaam | Kaisay |
|---|---|
| Purani enquiry dhoondna | Upar search box mein naam ya phone likhein |
| Sirf nayi dekhna | Filter se **New** chunein |
| Padhi hui mark karna | Enquiry kholein → status badlein |
| PDF banana | [Point 8 dekhein](#8-pdf-export-kaisay-karni-hai) |

> **Zaroori:** Enquiry ka data sirf logged-in admin dekh sakta hai. Website ka
> koi visitor doosray logon ki enquiries nahi parh sakta. Yeh database ki
> security settings se control hota hai.

---

## 8. PDF export kaisay karni hai

PDF banana teen tareeqon se ho sakta hai.

**Ek enquiry ki PDF:**

1. **Submissions** par jayein.
2. Jo enquiry chahiye usay kholein.
3. **Export PDF** dabayein.
4. PDF khud-ba-khud download ho jaye gi.

**Kai enquiries ki PDF:**

1. **Submissions** par jayein.
2. Har line ke shuru mein **checkbox** hai — jo chahiye un par tick lagayein.
3. Upar **Export selected** dabayein.
4. Sab ek hi PDF mein aa jayengi.

**Poori report:**

1. **Submissions** par jayein.
2. Agar filter lagana hai (date ya status ka) to pehlay laga lein.
3. **Export all** dabayein.

**CSV chahiye Excel ke liye?** Usi jagah **Export CSV** ka button hai. Us file
ko Excel ya Google Sheets mein khol saktay hain.

> PDF aap ke computer ke **Downloads** folder mein jati hai.

---

## 8-A. Left menu (sidebar) ka naqsha

Har cheez ka apna thikana hai. Yeh table saath rakhein — 90% sawal isi se hal
ho jaate hain:

| Menu mein | Kya us se hota hai |
|---|---|
| **Dashboard** | Ek nazar mein sab kuch |
| **Submissions** | Website ke forms se aanay waali inquiries |
| **Pages** ▾ | **Website ke saray pages aur un ke sections** — sab se ziyada isi ka istemal hoga |
| **Hero slides** | Home page ke upar waali barri tasveeren (slider) |
| **Statistics** | Number waalay aankray |
| **Projects** | Portfolio ke projects |
| **Services** | Services ki list |
| **Page copy** | Sirf un pages ka text jo simple qism ke hain (About, Leadership wagera) |
| **FAQs** | Sawal-jawab |
| **Testimonials** | Clients ki raaye |
| **Team** | Team members |
| **Settings** | Phone, email, address, social links, footer |
| **Admin users** | Kaun kaun log admin panel mein aa saktay hain |

> **Note:** pehlay jis cheez ka naam **Page builder** tha ab wo seedha
> **Pages** ban gayi hai, aur purani **Pages** ab **Page copy** kehlati hai.
> Naam badle hain, kaam wohi hai.

---

## 8-B. Sidebar se seedha section tak pohanchna (NAYA)

Yeh sab se tez tareeqa hai. Ab aap ko **Pages** kholne, phir page
dhoondhne, phir section dhoondhne ki zaroorat nahi — sab kuch left waalay
menu (sidebar) mein hi mil jaye ga.

### Kaisay chalta hai

1. Left menu mein **Website** ke neechay **Pages** likha hoga. Us ke saath
   ek chota sa teer ka nishan (chevron) hai.
2. Us nishan par click karein — ya bas mouse le jaayein. Website ke **saray
   pages** khul kar list ho jaayenge (Home, About, Services, Projects,
   Contact, wagera).
3. Ab jis page mein tabdeeli karni hai us par mouse le jaayein — misal ke
   taur par **Home**. Us ke saath bhi ek chota teer hai. Us par click karein.
4. Us page ke **saray sections** neechay khul jaayenge — Hero Section,
   Introduction, Services Section, wagera.
5. Jis section ka data update karna hai, seedha us par click karein.
6. **Editing form foran khul jaye ga.** Tabdeeli karein aur **Save changes**
   dabayein. Bas.

**Yehi tareeqa website ke har page ke liye chalta hai** — Home, About,
Services, har page ka apna sections ka dropdown hai.

### Sidebar mein jo nishaniyan dikhti hain

| Kya dikhta hai | Matlab |
|---|---|
| Page ke saath `2/3` | Is page ke 3 sections hain, 3 mein se 2 website par live hain |
| Page ke saath `—` | Is page ka abhi koi section nahi bana |
| Section par **hidden** ka label | Yeh section mojood hai lekin website par nazar nahi aa raha |
| Section ka naam kata hua (line) | Wohi baat — yeh section chupa hua hai |
| Section par halka rang / patti | Abhi yehi section khula hua hai |

### Chotay chotay faiday

- **Yaad rakhta hai:** aap ne jo pages khol rakhay thay, wo agli dafa login
  karne par bhi khulay milenge.
- **Talash:** agar sections ziyada ho jaayein to upar ek chota search box aa
  jata hai — page ya section ka naam likhein, foran mil jaye ga.
- **Link bhej saktay hain:** jab koi section khula ho to browser ka address
  copy kar ke kisi ko bhej dein — un ke kholne par wohi section khulay ga.
- **Back button chalta hai:** galti se koi aur section khul jaye to browser ka
  back button dabayein, wapis a jaayenge.
- **Collapse all:** sab kuch band karne ke liye list ke sab se neechay
  **Collapse all** ka button hai.

> **Mobile par:** upar bayein taraf teen lakeeron (☰) wala button dabayein,
> menu khul jaye ga. Wahan bhi bilkul isi tarah kaam karta hai — sirf mouse
> le jaanay ki jagah ungli se tap karna hai.

---

## 9. New section add kaisay karna hai

Section website ke kisi page ka ek hissa hota hai — jaisay Home page ka
upar wala bara banner (Hero), ya neechay wala Services ka hissa.

1. Left menu mein **Pages** par click karein.
2. Left taraf saray pages ki list hai. Jis page mein section daalna hai us par
   click karein — misal ke taur par **Home**.
3. Beech mein us page ke saray sections nazar aayenge, usi tarteeb mein jaisay
   visitor ko dikhte hain.
4. Upar dayein **Add section** dabayein.
5. Form khulay ga. Sab se upar ek neela box hoga jisme likha hoga:
   - **Page** — kis page par
   - **Section** — section ka naam
   - **Position** — kahan par (upar / beech / neechay)

   Yeh box hamesha batata hai ke aap website ka **kaunsa hissa** badal rahay
   hain. Save karne se pehlay ek dafa parh lein.
6. Bharein:
   - **Section name** — sirf aap ko dikhta hai, list mein pehchanne ke liye
   - **Section type** — kis qism ka section hai (neechay table dekhein)
   - **Heading** — bara heading jo visitor ko dikhe ga
   - **Body text** — tafseel
   - **Button text** aur **Button link** — agar button chahiye
7. **Add section** dabayein.

**Naya section hamesha page ke sab se neechay lagta hai.** Usay upar lay jaanay
ke liye us ki line mein ↑ (upar wala teer) dabayein.

**Section types:**

| Type | Kya karta hai |
|---|---|
| Hero | Page ke sab se upar bara banner |
| Introduction | Hero ke neechay chota taaruf |
| Content block | Aam heading + text + points |
| Services list | Services manager se khud data uthata hai |
| Projects grid | Projects manager se khud data uthata hai |
| Testimonials | Testimonials manager se khud data uthata hai |
| FAQ | FAQ manager se khud data uthata hai |
| Statistics | Statistics manager se khud data uthata hai |
| Process steps | Number waalay marhalay |
| Team | Team manager se khud data uthata hai |
| Call to action | Aakhir wala panel jisme button hota hai |
| Gallery | Tasveeron ki line |
| Contact | Contact tafseel ya form |
| Custom | Saray khanay khulay — jab koi aur type fit na ho |

> **Yaad rakhein:** "Services list", "Projects grid" jaisay sections ka content
> khud ba khud aata hai. Un mein alag se projects likhne ki zaroorat nahi —
> jo **Projects** page par add karenge wohi yahan aa jaye ga.

---

## 10. Existing section remove kaisay karna hai

**Do tareeqay hain. Pehla mehfooz hai, doosra hamesha ke liye.**

### Tareeqa 1 — Chupana (behtar hai)

1. Left menu mein **Pages** par jayein.
2. Page chunein.
3. Section ki line mein **Hide** dabayein.

Section website se ghayab ho jaye ga, lekin list mein mojood rahay ga aur
uska "Hidden" ka nishan lag jaye ga. Jab dobara chahiye ho, **Show** daba
dein. Kuch bhi zaya nahi hota.

### Tareeqa 2 — Delete (wapis nahi aata)

1. Left menu mein **Pages** par jayein.
2. Page chunein.
3. Section ki line mein **Delete** dabayein.
4. Confirmation box parhein, phir **Delete section** dabayein.

> **Mashwara:** 99% cases mein **Hide** hi kaafi hai. Delete sirf tab karein
> jab aap ko pakka yaqeen ho ke yeh section dobara kabhi nahi chahiye.

### Section ki tarteeb badalna

Har section ki line mein do teer hain:
- **↑** — ek qadam upar
- **↓** — ek qadam neechay

Har click foran save ho jata hai. Alag se Save dabanay ki zaroorat nahi.

### Section ki copy banana

**Duplicate** dabayein. Us section ki hoobahu copy page ke neechay lag jaye gi
aur **hidden** hogi. Yeh jaan boojh kar hidden rakhi jati hai — taake aap
itminan se edit kar sakein, aur adhoori copy visitors ko na dikhe. Jab tayyar
ho jaye, **Show** daba dein.

---

## 11. Home page edit kaisay karna hai

Home page kai hisson se bana hai. Har hissa alag jagah se control hota hai.

1. **Pages** kholein → **Home** chunein.
2. Saray sections nazar aa jayenge.
3. Jo badalna hai us ki line mein **Edit** dabayein.

**Kaunsa hissa kahan se badalta hai:**

| Home page ka hissa | Kahan se badlein |
|---|---|
| Upar wali slider/tasveerein | **Hero slides** page |
| Hero ka heading aur text | **Pages** → Home → Hero Section |
| Taaruf wala hissa | **Pages** → Home → Introduction |
| Services ke cards | **Services** page |
| Services ka heading | **Pages** → Home → Services Section |
| Projects ke cards | **Projects** page |
| Numbers (stats) | **Statistics** page |
| Clients ke tabsray | **Testimonials** page |
| Sawal jawab | **FAQs** page |
| Aakhir wala button panel | **Pages** → Home → Final CTA |
| Neechay wala footer | **Settings** page |

> **Asaan usool:** agar cheez ek **list** hai (kai projects, kai services), to
> uska apna alag page hai. Agar cheez ek **heading ya paragraph** hai, to wo
> **Pages** se badalti hai.

---

## 12. About page edit kaisay karna hai

About page ka address hai `/who-we-are`.

1. **Pages** kholein → **About** chunein.
2. Sections nazar aayenge:
   - **Hero Section** — upar ka bara heading
   - **Our Story** — company ki kahani
   - **Our Approach** — kaam ka tareeqa
   - **Team Section** — team ka hissa
3. **Edit** daba kar badlein → **Save changes**.

**Team members ki tafseel** alag jagah se badalti hai:
Menu → **Team** → wahan har fard ka naam, ohda, tasveer aur tafseel add ya
edit ki jati hai.

> **Ahem:** "Our Story" mein abhi placeholder text likha hua hai. Us mein
> company ki **asli** kahani likhein — kab shuru hui, kyun shuru hui, ab kahan
> tak pahunchi. Jhooti tafseel ya jhootay numbers na likhein.

---

## 13. Contact page edit kaisay karna hai

Contact page ke do hissay hain.

### A. Phone, email, address (Settings se)

1. Menu se **Settings** par click karein.
2. Yeh khanay milenge:
   - **Phone** — jaisay `+92 300 1234567`
   - **WhatsApp** — country code ke saath, bina space ya dash: `923001234567`
   - **Email**
   - **Address**
   - **Business hours**
3. **Save** dabayein.

> Yeh tafseel **poori website** par ek saath badalti hai — Contact page par
> bhi, footer mein bhi, aur WhatsApp button mein bhi. Ek jagah badlein, har
> jagah badal jaye gi.

### B. Heading aur text (Pages se)

1. **Pages** kholein → **Contact** chunein.
2. Sections:
   - **Hero Section** — upar ka heading
   - **Contact Details** — tafseel wala hissa
   - **Contact Form** — form ke upar ka text aur button ka naam
3. **Edit** → badlein → **Save changes**.

### Social media links

Menu → **Settings** → **Social links**. Facebook, Instagram, LinkedIn waghera
ke poore links yahan paste karein. Jo khana khali chor denge, us ka icon
website par nahi dikhe ga.

---

## 14. Image URL kaisay add karna hai

> **Ahem baat:** Is website par tasveer **upload nahi hoti**. Aap tasveer kisi
> aur jagah rakhtay hain, aur us ka **link** yahan paste kartay hain. Is se
> website tez chalti hai aur hosting ka kharcha kam rehta hai.

### Qadam 1 — Tasveer kahin rakhein

| Jagah | Kaisay |
|---|---|
| **Cloudinary** | Muft account banayein → upload karein → link copy karein. **Sab se behtar option hai.** |
| **Google Drive** | Upload → right click → Share → **Anyone with the link** → link copy karein |
| **imgbb / Postimages** | Website kholein → tasveer drag karein → **Direct link** copy karein |

### Qadam 2 — Link paste karein

1. Admin panel mein jahan **Image URL** ka khana hai, wahan link paste karein.
2. Link `https://` se shuru hona chahiye.
3. Paste karte hi **neechay tasveer ka preview** aa jaye ga.

**Preview aa gaya = link theek hai. Preview nahi aaya = link ghalat hai.**

### Agar preview nahi aa raha

| Wajah | Hal |
|---|---|
| Link `https://` se shuru nahi | Poora link dobara copy karein |
| Google Drive ki sharing setting | "Anyone with the link" karein |
| Page ka link copy kar liya, tasveer ka nahi | Tasveer par right click → **Copy image address** |
| Link mein space reh gaya | Aagay peechay ki space hata dein |

### Tasveer ke liye mashwaray

- **Size:** 1600 × 1000 pixels ke qareeb theek rehta hai
- **Wazan:** 500 KB se kam. Bari file website ko sust kar deti hai
- **Format:** JPG (tasveer ke liye) ya PNG (logo ke liye)
- **Shakal:** Chaurai zyada, lambai kam (landscape) — cards mein achi lagti hai

---

## 15. Video URL kaisay add karna hai

Video bhi upload nahi hoti. YouTube ya Vimeo ka link paste karna hota hai.

### YouTube

1. YouTube par apni video kholein.
2. Address bar se poora link copy karein:
   ```
   https://www.youtube.com/watch?v=XXXXXXXXXXX
   ```
   Ya **Share** daba kar chota link:
   ```
   https://youtu.be/XXXXXXXXXXX
   ```
3. Admin panel mein **Video URL** ke khanay mein paste karein.

> **Zaroori:** video **Private** na ho. "Public" ya "Unlisted" honi chahiye,
> warna visitors ko nahi chalay gi.

### Vimeo

1. Video kholein.
2. Link copy karein:
   ```
   https://vimeo.com/XXXXXXXXX
   ```
3. Paste kar dein.

### Video ke liye mashwaray

- **Lambai:** 1 se 3 minute — is se zyada log nahi dekhtay
- **Quality:** kam az kam 1080p
- **Awaaz:** saaf honi chahiye. Site par background music ka shor na ho
- **Thumbnail:** YouTube par achi thumbnail lagayein — wohi website par dikhe gi

---

## Aam masail aur un ka hal

| Masla | Hal |
|---|---|
| Change website par nahi dikh raha | Page refresh karein — **Ctrl + Shift + R** (Mac par **Cmd + Shift + R**) |
| Save ka button kaam nahi kar raha | Laal rang mein error dekhein. Koi zaroori khana khali hoga |
| Tasveer nahi dikh rahi | [Point 14](#14-image-url-kaisay-add-karna-hai) ka troubleshooting dekhein |
| Login nahi ho raha | [Point 2](#2-password-reset-kaisay-karna-hai) se password reset karein |
| Ghalti se delete kar diya | Delete wapis nahi aata. Content dobara banana paray ga |
| Section ghayab ho gaya | **Pages** mein dekhein — shayad **Hidden** ho gaya ho |
| Poori website hi nahi khul rahi | Yeh hosting ka masla hai, admin panel ka nahi. Developer se rabta karein |
| **Pages** par lal error: *"Could not find the table 'public.page_sections'"* | Neechay wala hissa parhein — 4 qadam mein theek ho jata hai |

---

## Agar Pages screen par error aa jaye

Kabhi kabhi Pages screen khulnay ke bajaye yeh likh deta hai:

> **The page builder could not load**
> Could not find the table 'public.page_sections' in the schema cache

**Ghabrane ki baat nahi.** Iska matlab sirf itna hai ke database mein wo
table nahi mil rahi jisme website ke saray sections rakhe jaate hain. Aap ka
koi bhi content — projects, services, FAQs, enquiries — mehfooz hai.

Admin panel khud hi aap ko screen par poora tareeqa bata dega. Wohi yahan bhi
likha hai:

1. Supabase dashboard kholein → bayein menu se **SQL Editor** → **New query**
2. Project se yeh file kholein aur **poori** copy karein:

   ```
   database/repair-page-sections.sql
   ```

3. SQL Editor mein paste karein aur **Run** dabayein
4. Admin panel mein wapis aayein, **Ctrl + Shift + R** se refresh karein

Bas. Pages screen dobara chal parray gi aur saray 91 sections wapis aa
jayenge.

**Kya yeh mehfooz hai? Ji haan:**

- Wo file sirf ghayab table banati hai — baqi kisi cheez ko haath nahi lagati
- Aap ne jo text pehle badla hoga wo **wapis nahi badle ga**
- Dobara chalana bhi mehfooz hai
- Agar khud karna mushkil lagay to developer ko yeh file ka naam bhej dein

---

## Har hafte ka chota sa kaam

1. **Submissions** kholein — koi nayi enquiry to nahi aayi
2. Har enquiry ka jawab dein
3. Jo project mukammal ho gaya, usay **Projects** mein add karein
4. Client se testimonial maangein aur **Testimonials** mein daalein
5. **Settings** mein phone aur email check karein ke sahi hain

---

## Kya karna hai, kya nahi

**Yeh karein:**
- Bara change karne se pehlay purana text kahin copy kar ke rakh lein
- Adhoori cheez ko **Hide** karein, delete na karein
- Har change ke baad website kholein aur khud dekh lein
- Sirf **asli** projects aur **asli** testimonials daalein
- Client ka naam sirf us ki ijazat se likhein

**Yeh na karein:**
- Apna password kisi ke saath share na karein
- Jhootay numbers na likhein (jaisay "500+ projects" agar sach nahi)
- Doosri websites se tasveerein copy kar ke na lagayein — copyright ka masla
  ban sakta hai
- URL slug baar baar na badlein — purana link kaam karna band kar deta hai
- Bina soche delete na karein

---

## Madad chahiye?

Agar koi cheez samajh nahi aa rahi, ya kuch kharab ho gaya hai:

1. Is guide mein us point ko dobara parhein
2. Screenshot lein (error ka message saaf nazar aana chahiye)
3. Developer ko bhejein aur batayein ke aap kya kar rahay thay

**Screenshot kaisay lein:**
- Windows: `Windows + Shift + S`
- Mac: `Cmd + Shift + 4`
- Phone: power button + volume down

---

*Yeh guide Siraj Builders ke admin panel ke liye hai. Panel mein koi nayi
cheez shaamil ho to yeh guide bhi update honi chahiye.*
