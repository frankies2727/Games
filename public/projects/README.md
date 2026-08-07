# Frankie's Projects — swappable images

Drop your images here to customize the projects area. Swap them whenever you
like (a fresh one every month works great) — no code change needed. Upload a
file with **the exact name** listed below (via GitHub → **Add file → Upload
files**, or `git add`) and it appears on the next deploy. Replace the same file
to change the image. If a file is missing, that spot falls back to the built-in
Pikachu, so nothing breaks while a slot is empty.

## 1. Home-screen hero banner

```
public/projects/homescreen.jpg
```

The big banner at the top of the **Frankie's Projects** gallery.

- **Format:** JPG is the default. To use PNG or WebP instead, name the file
  `homescreen.png` / `homescreen.webp` and update the one-line `HOMESCREEN_IMAGE`
  constant in `src/components/ProjectsGallery.tsx` to match.
- **Sizing:** A wide image works best (the banner is capped in height and
  cropped to fit). Roughly 1600×800 or any 2:1-ish landscape looks sharp.

## 2. Top-right "My Projects" button icon

```
public/projects/icon.png
```

The little icon on the **My Projects** portal button in the top-right corner of
the games home screen.

- **Format:** PNG is the default (transparency looks best). To use another
  format, name the file `icon.jpg` / `icon.webp` and update the one-line
  `PROJECTS_ICON` constant in `src/components/Gallery.tsx` to match.
- **Sizing:** A small **square** image with a transparent background works best
  (e.g. 128×128 or 256×256). It's shown in a rounded frame.

## Why this folder (`public/`)

Files under `public/` are served as-is at a stable URL — here that's
`/Games/projects/homescreen.jpg`. That's what lets you replace the picture by
just uploading a file, without touching or rebuilding any component code.

**Only add images you have the rights to** — your own artwork/photos, or
public-domain / royalty-free files. No copyrighted stock, watermarked, or
screenshot images.
