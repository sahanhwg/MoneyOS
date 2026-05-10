# Internet Money OS

> The ultimate financial intelligence platform for creators, freelancers, and online entrepreneurs.

## 🚀 Overview

Internet Money OS is a production-grade, SEO-optimized web platform that helps users understand, calculate, forecast, and benchmark their online income. Built entirely with vanilla HTML5, CSS3, and JavaScript — no frameworks, no dependencies beyond Chart.js.

## ✨ Features

### 10+ Smart Calculators
- **YouTube CPM Calculator** — Ad revenue with niche & country adjustments
- **YouTube RPM Calculator** — Revenue per mille with benchmark comparisons
- **TikTok Earnings Calculator** — Creator Rewards with program-specific rates
- **Sponsorship Estimator** — Influencer pricing by tier, engagement & niche
- **Affiliate Revenue Calculator** — Income from traffic, conversions & commissions
- **ROI Calculator** — Return on investment with timeframe projections
- **SaaS MRR Calculator** — Recurring revenue, churn, LTV & 12-month forecasts
- **Freelance Rate Calculator** — Hourly/daily/monthly rates for income goals
- **Shopify Profit Calculator** — E-commerce profitability with COGS & ROAS
- **Break-Even Calculator** — Unit economics & contribution margin analysis

### AI-Powered Insights
Every calculator generates intelligent, contextual recommendations based on:
- Industry benchmarks
- Niche-specific data
- Performance comparisons
- Growth opportunities

### Benchmark Engine
Compare your metrics against:
- YouTube CPM by niche (Finance: $25, Gaming: $5)
- CPM by country (USA: $12, India: $0.96)
- Creator income tiers (Nano to Mega)
- TikTok earnings by content category

### Visual Analytics
- Interactive doughnut charts (revenue breakdowns)
- Line charts (SaaS MRR projections)
- Bar charts (dashboard usage)
- Benchmark comparison bars

### Dashboard
- Saved calculation history
- Calculator usage analytics
- Recent activity feed
- Stats cards with trends

### Programmatic SEO
- Scalable calculator page architecture
- Geo-targeted pages (youtube-cpm-calculator-usa.html)
- Keyword-optimized meta tags
- Canonical URLs for variant pages

## 🏗️ Architecture

```
internet-money-os/
├── index.html                          # Homepage
├── assets/
│   ├── css/
│   │   ├── design-system.css           # CSS variables, reset, utilities
│   │   └── main.css                    # All component styles
│   ├── js/
│   │   ├── app.js                      # Core engine (theme, nav, storage, charts)
│   │   └── calculators.js              # All calculator logic & UI bindings
│   └── images/                         # (empty — use CDN or add assets)
├── components/                         # (future reusable components)
├── pages/
│   ├── calculators.html                # Calculator directory
│   ├── dashboard.html                  # User dashboard
│   ├── benchmarks.html                 # Industry benchmarks
│   ├── youtube-cpm-calculator.html
│   ├── youtube-cpm-calculator-usa.html # SEO geo page
│   ├── youtube-rpm-calculator.html
│   ├── tiktok-money-calculator.html
│   ├── sponsorship-estimator.html
│   ├── affiliate-revenue-calculator.html
│   ├── affiliate-income-calculator.html  # SEO variant
│   ├── roi-calculator.html
│   ├── saas-mrr-calculator.html
│   ├── freelance-rate-calculator.html
│   ├── shopify-profit-calculator.html
│   └── break-even-calculator.html
└── data/
    └── benchmarks.json                 # Structured benchmark data
```

## 🎨 Design System

- **Typography**: Inter (sans-serif) + JetBrains Mono (monospace)
- **Color Palette**: Primary indigo (#6366f1), with teal, amber, rose, emerald, sky accents
- **Dark/Light Mode**: Full theme switching with CSS variables & localStorage persistence
- **Glassmorphism**: Backdrop-filter panels with subtle borders
- **Animations**: Scroll-triggered reveals, counter animations, smooth transitions
- **Responsive**: Mobile-first, app-like experience on all devices

## ⚡ Performance

- Zero external CSS frameworks
- Chart.js loaded via CDN (defer)
- Modular JavaScript with lazy initialization
- CSS custom properties for instant theme switching
- Efficient DOM updates with debounced calculations

## 🔧 Tech Stack

| Technology | Usage |
|------------|-------|
| HTML5 | Semantic structure, SEO meta tags |
| CSS3 | Grid, Flexbox, variables, animations |
| Vanilla JS ES6+ | Modules, IntersectionObserver, localStorage |
| Chart.js 4.4.1 | Interactive charts (CDN) |
| Google Fonts | Inter + JetBrains Mono |

## 🚫 What's NOT Used

- ❌ React / Vue / Angular
- ❌ Tailwind / Bootstrap
- ❌ jQuery
- ❌ Next.js / Nuxt
- ❌ Backend framework
- ❌ Build tools / bundlers

## 🌍 SEO Strategy

- Keyword-rich page titles and meta descriptions
- Semantic HTML5 structure
- Canonical URLs for content variants
- Geo-targeted calculator pages
- Structured data-ready markup
- Fast-loading static files
- Mobile-optimized layouts

## 📊 Data Sources

Benchmark data is based on:
- 2025 industry reports
- Platform-specific rate cards
- Creator economy research
- Real-world case studies

## 🎯 Target Audience

- 🇺🇸 USA, 🇬🇧 UK, 🇨🇦 Canada, 🇦🇺 Australia
- YouTube creators
- TikTok creators
- Freelancers & consultants
- E-commerce owners
- SaaS founders
- Affiliate marketers
- Online entrepreneurs

## 📝 License

© 2025 Internet Money OS. All rights reserved.

---

Built with precision. Designed for scale. Ready for millions of users.
