# Post Layout Guide

## post.html (Smart Auto-Detecting Layout)
Single unified layout that automatically detects post type based on tags. No manual layout specification needed!

### Auto-Detection Logic:
- **If post has "project" tag** → Renders project-style footer with GitHub URL and Demo URL buttons (if present)
- **If post has "blog" tag** → Renders blog-style footer with only back-to-blog button
- **If post has neither tag** → Renders default footer with generic back button

### Project Post
```yaml
---
title: "My Project"
description: "Project description"
date: 2025-12-15
tags:
  - project
  - Python
  - Web Development
github_url: "https://github.com/user/project"
demo_url: "https://example.com/demo"
---
```
Renders: GitHub button, Demo button, Back to Project Log button

### Blog Post
```yaml
---
title: "My Blog Post"
description: "Blog post description"
date: 2025-12-15
tags:
  - blog
  - Tutorial
  - JavaScript
---
```
Renders: Back to Blog Log button only

### Default Post
```yaml
---
title: "My Post"
description: "Post description"
date: 2025-12-15
tags:
  - Tutorial
---
```
Renders: Generic back button

## Additional Layouts (Kept for backward compatibility)
- `projectPost.html` - Manual project layout
- `blogPost.html` - Manual blog layout
- `post.html` - Smart auto-detecting layout (default, recommended)
