# Move Over KC Website

A clean, fast, futuristic website for Move Over KC. It is plain HTML, CSS, and JavaScript, so it works on any host. There is nothing to build or install for the website itself.

## Part 1: What is in the folder

```
index.html          Home page (with the quote box)
services.html       Moving, Junk Removal, Handyman, pricing
photos.html         Photo gallery
reviews.html        Verified customer reviews
review.html         Private page customers use to leave a review (needs a link)
about.html          Your story
careers.html        Job openings and application form
faq.html            Frequently asked questions
contact.html        Contact page with the quote box
privacy.html        Privacy page
404.html            "Page not found" page
admin.html          Your private owner tools (create review links, see messages)
photos.json         The list of gallery photos (you edit this)
robots.txt          Search engine instructions
sitemap.xml         Page list for Google
css/styles.css      All colors, fonts, and layout
js/config.js        Your phone number, backend address, social links
js/main.js          Menu, footer, forms (edit the menu list here once)
js/photos.js        Gallery code (no edits needed)
js/reviews.js       Reviews page code (no edits needed)
js/review-submit.js Review form code (no edits needed)
js/admin.js         Owner tools code (no edits needed)
images/gallery/     PUT YOUR JOB PHOTOS HERE
images/logo.png     Your signature logo (white on transparent), used on every page
images/logo-full.png Your logo with phone and website, shown on the Contact page
images/share.png    Preview picture when your site is shared on social media or in texts
images/favicon.png  Browser tab icon (also apple-touch-icon.png for phone home screens)
worker/worker.js    The backend (texts you, handles verified reviews)
worker/wrangler.toml Backend settings (only for the command line option)
```

The website works the moment you upload it. The quote box, applications, and verified reviews need the backend in Part 3 to do their jobs. Until then, the forms politely tell visitors to call or text 660-351-4699.

## Part 2: Copy it into your GitHub repository

Important: upload the contents of the folder, so that `index.html` sits at the top level of your repository. Do not upload the `move-over-kc` folder itself as a subfolder.

### Option A: Drag and drop (easiest, on a computer)

1. Unzip `move-over-kc.zip`. Open the unzipped folder.
2. Go to your repository on github.com.
3. Click **Add file**, then **Upload files**.
4. Select everything inside the unzipped folder (the pages, `css`, `js`, `images`, `worker`, and so on) and drag it all into the upload box. Chrome, Edge, and Firefox keep the folders.
5. Scroll down, type a message such as "New website", and click **Commit changes**.

### Option B: Copy and paste one file at a time (works from a phone browser)

1. In your repository click **Add file**, then **Create new file**.
2. In the name box type the file path exactly, for example `index.html` or `css/styles.css`. Typing a slash creates the folder for you.
3. Paste the full contents of that file into the big editor.
4. Click **Commit changes**. Repeat for every file.

Files to create, in this order: `css/styles.css`, `js/config.js`, `js/main.js`, `js/photos.js`, `js/reviews.js`, `js/review-submit.js`, `js/admin.js`, `photos.json`, `images/logo.png`, `images/logo-full.png`, `images/share.png`, `images/favicon.png`, `images/apple-touch-icon.png` (these are pictures, so use Option A or C for them), then all the `.html` pages, `robots.txt`, `sitemap.xml`, and `worker/worker.js`.

### Option C: Git commands (if you use GitHub Desktop or a terminal)

```
git clone https://github.com/YOUR-USERNAME/YOUR-REPO.git
# copy the files from the unzipped folder into the cloned folder
cd YOUR-REPO
git add .
git commit -m "New website"
git push
```

After the push, your host picks up the new files (or you redeploy, depending on how your host is connected to GitHub).

## Part 3: Switch on the backend (quote texts and verified reviews)

A website that is just files cannot send a text message by itself. The backend is one small file (`worker/worker.js`) that runs for free on Cloudflare and uses Twilio to text your phone. It also keeps your private review links safe.

### Step 1: Twilio (the texting service)

1. Create an account at twilio.com and buy a phone number that can send texts.
2. Copy your **Account SID** and **Auth Token** from the Twilio console.
3. Complete Twilio's US texting registration for your number (toll-free verification or A2P 10DLC). US carriers block unregistered texts, so do this before testing. It can take a few days.
4. Twilio charges a small monthly fee for the number and a small fee per text. Check Twilio's current pricing page.

### Step 2: Cloudflare (runs the backend)

Menu names may look slightly different when you do this, but the steps are the same.

1. Create a free account at cloudflare.com.
2. Go to **Workers and Pages**, click **Create**, choose **Start with Hello World** (a Worker), name it `moveoverkc-api`, and click **Deploy**.
3. Click **Edit code**, delete everything, paste in all of `worker/worker.js`, and click **Deploy**.
4. Go to **Storage and Databases**, then **KV**, and create a namespace named `moveoverkc`.
5. Back in your Worker, open **Settings**, then **Bindings**, click **Add**, choose **KV namespace**, set the variable name to exactly `MOKC`, and pick the `moveoverkc` namespace.
6. In **Settings**, then **Variables and Secrets**, add these as plain text:
   - `SITE_URL` = your website address with no slash at the end, such as `https://www.moveoverkc.com`
   - `ALLOWED_ORIGINS` = every address your site loads from, separated by commas, such as `https://moveoverkc.com,https://www.moveoverkc.com`
   - `OWNER_PHONE` = `+16603514699`
   - `TWILIO_ACCOUNT_SID` = from Twilio
   - `TWILIO_FROM` = your Twilio number in this format: `+18165550123`
7. Add these two as **Secrets** (they are hidden after you save):
   - `TWILIO_AUTH_TOKEN` = from Twilio
   - `ADMIN_KEY` = a long private passphrase that only you know (this unlocks `admin.html`)
8. Copy your Worker's address. It looks like `https://moveoverkc-api.your-name.workers.dev`.

Command line fans can instead edit `worker/wrangler.toml`, then run `npx wrangler kv namespace create MOKC`, paste the id into the file, run `npx wrangler secret put TWILIO_AUTH_TOKEN` and `npx wrangler secret put ADMIN_KEY`, then `npx wrangler deploy`.

### Step 3: Connect the website to the backend

1. Open `js/config.js` in GitHub (pencil icon).
2. Paste your Worker address between the quotes after `API_BASE:`.
3. Commit the change.

### Step 4: Test everything

1. Submit the quote box on your live site. A text should land on 660-351-4699.
2. Visit `yoursite.com/admin.html`, enter your owner key, and create a review link for yourself.
3. Open that link in a private browser tab and leave a test review. It should appear on the reviews page. Delete the test review from the owner page afterward.

## Part 4: Day to day

**Add photos.** Put photo files in `images/gallery/`, then add an entry for each photo in `photos.json` (instructions are inside that file and in `images/gallery/README.txt`). Open `photos.html?help=1` any time to see a reminder note on the page.

**Collect a verified review.** After a job, open `yoursite.com/admin.html` on your phone (bookmark it), unlock it, type the customer's name, and tap **Create link**. Then tap **Share**, **Copy link**, or **Text it to customer**. Each link works once and expires after 60 days. Only people with a link can leave a review.

**Remove a review.** Open the owner page and tap **Delete** under the review.

**Missed a text?** The owner page keeps a backup of every quote request and application for 90 days, and marks any that did not text through.

## Part 5: Fill in the blanks

Everything that needs your input is highlighted in yellow on the site and written like `[[FILL IN: ...]]`, `[[CONFIRM: ...]]`, or `[[EDIT: ...]]`. To find them all, use the GitHub search bar in your repository and search for `FILL IN`, then `CONFIRM`, then `EDIT`. Remove the brackets and highlight when you are done (delete the whole `<mark class="fill">...</mark>` tag).

Where they are:

- `index.html`: the cities you serve
- `services.html`: what is included in each service, and how you price
- `contact.html`: your hours
- `about.html`: your coaching paragraph, and a portrait saved as `images/ryan.jpg`
- `careers.html`: which roles are open, pay, requirements, hiring process
- `faq.html`: service area, insurance, damage policy, payment, lead time, what you cannot haul, what happens to junk
- `privacy.html`: the date (this page is a general template, not legal advice, so please review it)
- `js/config.js`: business email and social links (optional)
- `robots.txt`, `sitemap.xml`, and the share tags in `index.html`: already set to `moveoverkc.com`. If your live address includes `www`, change it to match

Please only state things on the site that are true and current, especially insurance and licensing.

## Part 6: Making it your own

- **Colors and fonts:** the top of `css/styles.css` (the `:root` block) controls them. The site is black, white, and gold. The gold is `--accent` (#d4af37) and `--accent-2` (#f3d77b). Change those two and every gold detail follows.
- **Logo:** to swap the logo later, replace `images/logo.png` with a white-on-transparent PNG of the same name.
- **Menu:** the `NAV` list at the top of `js/main.js` controls the menu on every page.
- **Phone number:** change it in `js/config.js`, and in the few places it is written in page text (search for `660-351-4699`).

If you would rather get new-lead alerts as an email with a phone notification instead of a text, the backend can be switched to do that with no Twilio account. Ask and it can be swapped in.
