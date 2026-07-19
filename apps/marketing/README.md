# Universal S3 Client - Website

Showcase website for Universal S3 Client, the native macOS application for managing your S3 buckets.

## About

Universal S3 Client is a native macOS application designed to simplify S3 data management. Compatible with AWS S3, Cloudflare R2, MinIO and all S3-compatible services.

### Key Features

- ✅ **Native macOS interface** with optimal user experience
- ✅ **Multi-provider S3** (AWS S3, Cloudflare R2, MinIO, etc.)
- ✅ **Optimized transfers** with multipart support and automatic resume
- ✅ **Enhanced security** with encryption and Keychain storage
- ✅ **Advanced management** (permissions, versioning, synchronization)
- ✅ **Integrated blog** with articles and best practices

## Tech Stack

This website is built with:

- **[Astro 5.0](https://astro.build/)** - Modern web framework
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **TypeScript** - Static typing
- **MDX** - Markdown with React components

## Project Structure

```
/
├── public/                 # Static assets
├── src/
│   ├── assets/            # Images and styles
│   ├── components/        # Astro/React components
│   │   ├── blog/          # Blog components
│   │   ├── widgets/       # Reusable widgets
│   │   └── ui/            # UI components
│   ├── content/           # Content configuration
│   ├── data/              # Blog articles (Markdown)
│   │   └── post/          # Articles
│   ├── layouts/           # Page layouts
│   ├── pages/             # Site pages
│   │   ├── [...blog]/     # Dynamic blog pages
│   │   ├── index.astro    # Homepage
│   │   ├── privacy.md     # Privacy policy
│   │   └── terms.md       # Terms of service
│   └── utils/             # Utilities
├── astro.config.ts        # Astro configuration
└── tailwind.config.js     # Tailwind configuration
```

## Development

### Prerequisites

- Node.js 18.17.1+ or 20.3.0+ or 21.0.0+
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd universal-s3-client-website

# Install dependencies
npm install
```

### Available Commands

| Command                 | Action                                            |
| :---------------------- | :------------------------------------------------ |
| `npm run dev`           | Start development server                          |
| `npm run build`         | Build the site for production                     |
| `npm run preview`       | Preview local build                               |
| `npm run check`         | Check project (Astro, ESLint, Prettier)          |
| `npm run fix`           | Automatically fix errors                          |

### Local Development

```bash
# Start development server
npm run dev
```

The site will be accessible at `http://localhost:4321`

## Configuration

### Main Configuration Files

- `src/config.yaml` - General site configuration
- `src/navigation.ts` - Navigation menu
- `astro.config.ts` - Astro configuration
- `tailwind.config.js` - Tailwind CSS configuration

### SEO Metadata

SEO metadata is configured in `src/config.yaml`:

```yaml
metadata:
  title:
    default: Universal S3 Client
    template: '%s — Universal S3 Client'
  description: "Native macOS app to manage your S3 buckets..."
```

## Content

### Blog Articles

Articles are stored in `src/data/post/` in Markdown format with frontmatter:

```markdown
---
publishDate: 2024-12-19T00:00:00Z
title: "Article Title"
excerpt: "Short description..."
image: https://example.com/image.jpg
tags:
  - s3
  - aws
---

Article content...
```

### Static Pages

- **Homepage** (`src/pages/index.astro`) - Main page with features
- **Blog** (`src/pages/[...blog]/`) - Dynamic blog pages
- **Privacy** (`src/pages/privacy.md`) - Privacy policy
- **Terms** (`src/pages/terms.md`) - Terms of service

## Deployment

### Production Build

```bash
npm run build
```

Generated files are located in the `dist/` folder

### Supported Platforms

The site can be deployed on:

- **Vercel** (recommended)
- **Netlify**
- **GitHub Pages**
- **Traditional static hosting**

### Environment Variables

No environment variables required for basic operation.

## Contributing

1. Fork the project
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License. See the `LICENSE.md` file for details.

---

**Universal S3 Client** - Simplify your S3 management on macOS
