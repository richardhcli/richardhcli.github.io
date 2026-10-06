# richardhcli.github.io

Personal site, built with [Hugo](https://gohugo.io/).

## Vision

Cut the noise. The site should be as basic as it can be. The only content that matters is the text.

If the work that matters is machine learning research, the site is a place to show technical rigor, research momentum, and how you think about managing work. Peers and lab leadership should be able to read that without a designed product in the way.

That community prefers hyper-minimalist, text-forward static sites. A complex layout is a distraction unless the work itself is product design or front-end. John Schulman and Leo Gao publish this way: a plain template, and the research right there.

Hugo fits. It is one Go binary, needs no language runtime, and renders raw markdown. Jekyll with al-folio is the older academic default and has citation tools, but it pulls in Ruby. MkDocs and Eleventy are other ways to keep the markdown separate from the styling. This repo is Hugo with a small custom layout and one CSS file: dark background, a profile panel, and the Dracula palette.

A push to `main` builds the site and publishes it to GitHub Pages. A custom domain means setting `baseURL` in `hugo.toml`, pointing DNS `A` and `CNAME` records at GitHub, and turning on HTTPS in the repository settings.

## Preview

```bash
hugo server -D --disableFastRender --noHTTPCache
```

Open http://localhost:1313/. `-D` shows drafts. The live site leaves drafts out.

## A new note

A note is a folder. The writing is `index.md`. Pictures, video, and PDFs go in that same folder.

Notes for a year sit in a plain folder named with that year. The note folder itself still starts with the date as `YYYY.MM.DD`. You type the section and the slug.

Macros live in `macros/`. `new-note.ps1` reads the clock once, creates the year folder if it is missing, and fills in the date prefix:

```powershell
.\macros\new-note.ps1 blog/new_post
.\macros\new-note.ps1 projects/new_post
```

The same folder from Hugo, with no macro:

```powershell
$now = Get-Date
hugo new content "blog/$($now.ToString('yyyy'))/$($now.ToString('yyyy.MM.dd'))-new_post/index.md"
hugo new content "projects/$($now.ToString('yyyy'))/$($now.ToString('yyyy.MM.dd'))-new_post/index.md"
```

Run on 4 October 2026, either command creates `content/blog/2026/2026.10.04-new_post/`. The year folder has no page of its own. The date prefix is only for your file list. The public URL is `/blog/new_post/`, from the `slug` line the command fills in. Edit `title` if you want different words. Rename the part after the date if you want a different URL, and keep `slug` the same as that part.

`draft: true` keeps the note off the live site. Delete that line when it is ready, then push to `main`.

## Files that belong to the note

Put them next to `index.md` and refer to them by name:

```markdown
![what the picture shows](diagram.png)

[writeup](notes.pdf)
```

```
{{< video "demo.mp4" >}}
```

## Front matter

```yaml
title: "My Note"
description: "One line, shown on the Blog or Projects list."
date: 2026-10-03
slug: my-note
tags: []
draft: true
```

Project notes also have `github_url` and `demo_url`. Leave either one as `""` and that link is omitted.

Tags are a list. They show under the note on Blog and Projects, and next to the date on the note itself.

```yaml
tags:
  - machine learning
```

## What stays outside a note

`static/` is for files that belong to the whole site: See `static/README.md`

Hugo writes the generated site to `build/`. That folder is gitignored.
