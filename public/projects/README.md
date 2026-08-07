# Frankie's Projects — monthly home-screen image

Drop your featured image here to set the big hero banner at the top of the
**Frankie's Projects** gallery. Swap it whenever you like (a fresh one every
month works great) — no code change needed.

## The exact path

```
public/projects/homescreen.jpg
```

Upload a file with **that exact name** (via GitHub → **Add file → Upload
files**, or `git add`). On the next deploy it appears automatically at the top
of the projects home screen. Replace the same file to change the image.

- **Missing?** If `homescreen.jpg` isn't here, the gallery falls back to the
  Pikachu header, so nothing breaks while the slot is empty.
- **Format:** JPG is the default. To use PNG or WebP instead, name the file
  `homescreen.png` / `homescreen.webp` and update the one-line `HOMESCREEN_IMAGE`
  constant in `src/components/ProjectsGallery.tsx` to match.
- **Sizing:** A wide image works best (the banner is capped in height and
  cropped to fit). Roughly 1600×800 or any 2:1-ish landscape looks sharp.

## Why this folder (`public/`)

Files under `public/` are served as-is at a stable URL — here that's
`/Games/projects/homescreen.jpg`. That's what lets you replace the picture by
just uploading a file, without touching or rebuilding any component code.

**Only add images you have the rights to** — your own artwork/photos, or
public-domain / royalty-free files. No copyrighted stock, watermarked, or
screenshot images.
