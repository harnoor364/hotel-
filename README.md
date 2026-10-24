# Hotel Kabir — demo website

A sales demo website for **Hotel Kabir**. Plain HTML, CSS and vanilla JavaScript — no frameworks and no build step.

> All room prices, room details and amenities are imaginary placeholders. There are no real contact details, addresses, reviews or payments. The booking and enquiry forms run entirely in the browser and send nothing anywhere.

## File structure

```
.
├── index.html        Home: hero + availability bar, about, featured rooms,
│                     amenities, scroll-driven walkthrough, gallery, call-to-action
├── rooms.html        Rooms & Prices: 4 room types + price calculator (nights × rate + 12% GST)
├── booking.html      3-step booking form with validation, live price and demo confirmation
├── contact.html      Call / WhatsApp buttons, enquiry form, map placeholder
├── 404.html          Not-found page (Netlify serves it automatically)
├── css/
│   └── style.css     All styles (mobile-first)
├── js/
│   ├── site.js       Shared: room data & prices, header, footer, contact popup,
│   │                 floating mobile buttons, scroll reveals, image fallback
│   ├── home.js       Availability bar + walkthrough
│   ├── rooms.js      Room list + price calculator
│   ├── booking.js    Booking steps, validation, booking ID
│   └── contact.js    Enquiry form
├── assets/
│   └── favicon.svg
└── netlify.toml      Netlify settings (publish root, cache headers)
```

### Where to change things

- **Room names, prices, sizes, amenities, photos:** the `ROOMS` list at the top of `js/site.js`. The rooms page, calculator and booking form all read from it. (The three featured cards on the home page are written in `index.html`, so update those prices there too.)
- **GST rate:** `GST_RATE` in `js/site.js`.
- **Header and footer:** generated once in `js/site.js`, so every page stays in sync.
- **Phone / WhatsApp:** currently a "number coming soon" popup. When a real number is available, replace the popup handler in `js/site.js` with `tel:` and `https://wa.me/` links.
- **Colours and fonts:** CSS variables at the top of `css/style.css`.

### The walkthrough

The "Walkthrough" section on the home page is a scroll-driven tour: as you scroll, it moves through six scenes (arrival, lobby, room, bed, bath, dining) with a slow camera push-in, captions and a video-style progress bar. The play button scrolls through it automatically. To swap in the hotel's own photos, change the six `<img>` tags inside `<section class="tour">` in `index.html`.

### Images

Photos are generic stock images loaded from the Unsplash CDN, resized with URL parameters (`w=`, `q=`, `auto=format`) and lazy-loaded below the fold. If any photo fails to load, `site.js` swaps in a backup photo, then a plain styled background. Replace them with real hotel photos before going live.

## Run locally

Any static server works, for example:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Deploy to Netlify

**Option A — from GitHub (auto-deploys on every push)**

1. Log in to [Netlify](https://app.netlify.com) and click **Add new site → Import an existing project**.
2. Choose **GitHub** and pick the `harnoor364/hotel-` repository.
3. Select the branch to deploy.
4. Leave **Build command** empty and set **Publish directory** to `.` (already set in `netlify.toml`).
5. Click **Deploy**. Netlify gives you a `*.netlify.app` link you can open on your phone.

**Option B — drag and drop**

1. Download the repository as a ZIP and unzip it.
2. Go to [app.netlify.com/drop](https://app.netlify.com/drop) and drag the folder onto the page.

To use a custom domain later, open **Site settings → Domain management** in Netlify.
