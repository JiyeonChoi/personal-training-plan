# Workout Plan

A simple, phone-friendly page for sharing workout plans, with images and videos for each exercise.

## Editing workouts

Everything lives in **`workouts.js`**. Each workout is a tab; each exercise has a name, section,
target, minutes, sets, reps, notes, and optional `image` / `video`.

- **Images:** put files in `media/` and write `image: "media/deadbugs.jpg"` (or a list for several).
- **Videos:** paste a YouTube or Vimeo link, or use a file: `video: "media/swing.mp4"`.
  Short phone clips are best uploaded to YouTube as *Unlisted* to keep the repo small.
- **Supersets:** number exercises `7.1`, `7.2`, `7.3` and they're grouped together.

Your friend can tick off exercises as she goes; that's saved on her phone only.

**Start workout** opens focus mode: one exercise at a time, with set buttons and a "Done, next" button
that ticks the exercise off and moves on.

## Changing the look

The main colour is `--accent` at the top of `styles.css`. Section colours live in `COMPONENTS` in `workouts.js`.

## Preview locally

Open `index.html` in a browser. No build step.

## Hosting

It's a plain static site, so any static host works. With a private repo, the easiest free option
is Netlify or Vercel: import the repo, leave the build command empty, and share the URL.
