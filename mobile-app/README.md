# Bonton Mobile App (বণ্টন) 📱

A modern, privacy-focused, local-first group expense sharing and debt settlement mobile application built with **React Native** and **Expo SDK 58**.

---

## 🌟 Overview

**Bonton Mobile App** brings the powerful expense splitting and greedy settlement optimization of Bonton directly to Android and iOS devices. Designed with a local-first philosophy, your financial records stay strictly on your device without mandatory logins or cloud dependencies.

---

## 🛠️ Tech Stack & Build Environment

| Technology | Version / Spec | Description |
| :--- | :--- | :--- |
| **Framework** | Expo SDK `~58.0.0` (Expo Router v58) | File-based routing and universal navigation |
| **Runtime** | React `19.3.0` / React Native `0.88.1` | Modern New Architecture (Fabric & TurboModules) |
| **Styling** | `react-native-unistyles` `^3.0.22` | Zero-runtime overhead stylesheet system |
| **State Management** | `zustand` `^5.0.11` | Lightweight state with offline local persistence |
| **Localization** | `i18next` & `react-i18next` | Full bilingual support (Bengali বাংলা & English) |
| **Animations** | `react-native-reanimated` `4.7.1` | Native 60+ FPS gestures and layout transitions |
| **Graphics & Icons** | `react-native-svg` | Crisp vector icons and customized graphic receipts |
| **Build System** | Gradle `9.4.1` / Android SDK 35 | Strict environment pinning matching modern build tools |
| **Package Manager** | [Bun](https://bun.sh/) | Blazing fast JavaScript runtime and package manager |

---

## 🎨 Visual Design & 5 Pre-configured Themes

Powered by Unistyles v3, the mobile app supports 5 curated themes:

1. **Light (Emerald)**: `#10B981` Primary — Crisp, clean everyday aesthetic.
2. **Dark (Slate & Mint)**: `#34D399` Primary — Battery-saving, eye-friendly night mode.
3. **Sepia (Warm Amber)**: `#C25E00` Primary — Warm paper tones inspired by vintage books.
4. **Forest (Deep Green)**: `#15803D` Primary — Soothing nature-inspired theme.
5. **Ocean (Marine Blue)**: `#1976D2` Primary — Modern, high-trust blue tone.

---

## ⚡ Core Features

- **Local-First & Offline Ready**: Fast offline execution with local storage.
- **Integer Cents Math**: All calculations executed in integer poisha/cents to prevent floating-point inaccuracies.
- **5 Expense Splitting Modes**:
  - Equal Split (with remainder cents auto-allocated)
  - Percentage Split (with 100% auto-normalization)
  - Custom / Fixed Amount Split
  - Initial Personal Bills Deduction (deduct personal items before shared split)
  - Multiple Payers Support (multiple members contributing to one bill)
- **Smart Debt Simplification (Greedy Algorithm)**: Converts tangled group balances into the minimum number of transactions (`A pays B ৳500`).
- **Native Share & Export**: Generate digital PNG receipt cards to share instantly via WhatsApp, Messenger, or system share sheets.
- **Member Rebalancing**: Add or remove members dynamically with auto-rebalanced balance sheets.
- **Multi-Currency Support**: ৳ (BDT), $ (USD), € (EUR), £ (GBP), ₹ (INR).

---

## 📁 Modular Directory Structure (`src/`)

```text
mobile-app/
├── src/
│   ├── app/                          # Expo Router file-based screens
│   │   ├── _layout.tsx               # Root layout (Unistyles, Zustand, i18n providers)
│   │   ├── (tabs)/                   # Bottom tab navigator
│   │   │   ├── index.tsx             # Dashboard summary & group list
│   │   │   └── settings.tsx          # 5-theme switcher & language selector
│   │   ├── groups/
│   │   │   ├── new.tsx               # Create group modal
│   │   │   └── [id].tsx              # Group details, expenses & settlements
│   │   └── expense/
│   │       ├── add.tsx               # Add expense modal with split models
│   │       └── [expenseId].tsx       # Edit expense
│   ├── features/                     # Feature modules (Components, hooks, types)
│   │   ├── dashboard/                # Summary cards & balance overview
│   │   ├── groups/                   # Group cards, member avatar chips
│   │   ├── expenses/                 # Expense forms, split percentage sliders
│   │   ├── settlement/               # Optimized debt cards & who-owes-whom list
│   │   └── export/                   # Digital receipt image canvas & native sharing
│   └── shared/                       # Cross-cutting concerns
│       ├── components/               # UI components (Button, Input, Card, Badge)
│       ├── theme/                    # Unistyles 3.0 theme definitions
│       ├── store/                    # Zustand store with async persistence
│       ├── lib/                      # Debt settlement math & integer calculations
│       ├── i18n/                     # Bengali & English translations
│       └── types/                    # Shared TypeScript interfaces
├── app.json                          # Expo configuration
├── babel.config.js                   # Babel config with Unistyles & Reanimated plugins
└── tsconfig.json                     # TypeScript path alias (@/* -> ./src/*)
```

---

## 🚀 Getting Started

### Prerequisites
- [Bun](https://bun.sh/) (`v1.2+`)
- [Node.js](https://nodejs.org/) (`v20.x` or `v22.x` LTS)
- JDK 17 (OpenJDK 17 recommended for Gradle 9)
- Android Studio / Android SDK 35

### Installation & Run

```bash
# 1. Install dependencies
bun install

# 2. Type-check
bun run type-check

# 3. Start Expo development server
bun run start

# 4. Run on Android device/emulator
bun run android

# 5. Run on iOS simulator (macOS only)
bun run ios
```

---

## 📄 License
MIT License
