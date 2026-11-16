# Bonton Admin Portal (বণ্টন অ্যাডমিন পোর্টাল) 📊

Internal administration, system telemetry, health monitoring, and analytics dashboard for the **Bonton (বণ্টন)** ecosystem.

---

## 🌟 Overview

**Bonton Admin Portal** is a management dashboard built for developers, system administrators, and product managers to monitor infrastructure performance, track client app version adoption, manage feature rollouts, and oversee sync relay health.

---

## ⚡ Core Features

- **System Telemetry & Health Monitoring**: Live metrics for sync gateway status, API response latencies, and WebSocket connection pools.
- **Client App Analytics**: Real-time adoption tracking across Web (`landing-portal`) and Mobile (`mobile-app`) platforms without tracking personal user identities.
- **Feature Flag Management**: Dynamic toggles for experimental features (e.g., new split models, export engines, P2P sync).
- **Incident & Error Auditing**: Centralized dashboard for server error traces and service availability.
- **Link & Abuse Moderation**: Inspection tools for reporting and invalidating compromised or malicious public invite links.

---

## 🛠️ Tech Stack

| Technology | Purpose |
| :--- | :--- |
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router) or Vite + [React 19](https://react.dev/) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) & CSS Variables |
| **UI Components** | [shadcn/ui](https://ui.shadcn.com/) & [Radix UI](https://www.radix-ui.com/) |
| **Charts & Data Viz** | [Recharts](https://recharts.org/) / Lucide React |
| **State & Data Fetching** | [TanStack Query](https://tanstack.com/query) & [Zustand](https://zustand.docs.pmnd.rs/) |

---

## 📁 Directory Structure

```text
admin-portal/
├── src/
│   ├── app/                  # Next.js App Router (Dashboard pages, metrics, settings)
│   ├── components/           # Reusable UI widgets, stats cards, and tables
│   │   ├── charts/           # Latency, adoption, and active connection charts
│   │   ├── ui/               # shadcn/ui base primitives
│   │   └── common/           # Sidebar, header, authentication guards
│   ├── features/             # Feature slices (telemetry, flags, logs, invites)
│   ├── lib/                  # API client, date formatters, and utilities
│   └── types/                # Analytics and metric data models
├── public/                   # Static assets & dashboard icons
├── package.json              # Dashboard dependencies
└── tsconfig.json             # TypeScript configuration
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js `20.x` or later (`24.x` recommended)
- pnpm `v10.x` or later

### Installation & Run

```bash
# 1. Install dependencies
pnpm install

# 2. Start development server
pnpm dev

# 3. Build for production
pnpm build
pnpm start
```

---

## 📄 License
MIT License
