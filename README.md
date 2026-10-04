# richardhcli.github.io

Personal site, built with [Hugo](https://gohugo.io/).

## Preview

```bash
hugo server -D
```

Open http://localhost:1313/. `-D` shows drafts. The live site leaves drafts out.

## A new note

A note is a folder. The writing is `index.md`. Pictures, video, and PDFs go in that same folder.

Blog:

```bash
hugo new content blog/my-note/index.md
```

Project:

```bash
hugo new content projects/my-note/index.md
```

The folder name is the URL and the starting title. `projects/my-note` is published at `/projects/my-note/` with the title "My Note". Edit the title in `index.md` if you want different words. Rename the folder if you want a different URL. Use hyphens, not spaces.

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
tags: []
draft: true
```

Project notes also have `github_url` and `demo_url`. Leave either one as `""` and that link is omitted.

Tags are a list:

```yaml
tags:
  - machine learning
```

## What stays outside a note

`static/` is for files that belong to the whole site: `static/css/style.css`, `static/favicon.svg`, and `static/resume.pdf`. The resume link on the home page is `/resume.pdf`.
