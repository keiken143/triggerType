# TriggerType — Detailed Application Report

**Report Date:** March 8, 2026  
**Application URL:** https://triggertype.lovable.app  
**Version:** 0.0.0 (Active Development)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Application Overview](#2-application-overview)
3. [Technology Stack](#3-technology-stack)
4. [Architecture & System Design](#4-architecture--system-design)
5. [Feature Inventory](#5-feature-inventory)
6. [Database Schema](#6-database-schema)
7. [AI Integration](#7-ai-integration)
8. [User Interface & Design System](#8-user-interface--design-system)
9. [Authentication & Security](#9-authentication--security)
10. [Routing & Navigation](#10-routing--navigation)
11. [Component Architecture](#11-component-architecture)
12. [Performance & Optimization](#12-performance--optimization)
13. [Strengths](#13-strengths)
14. [Areas for Improvement](#14-areas-for-improvement)
15. [Recommendations](#15-recommendations)

---

## 1. Executive Summary

**TriggerType** is a web-based typing practice application designed for developers and general users to improve their typing speed and accuracy. It differentiates itself through **AI-powered content generation**, **code-specific typing practice** across 7 programming languages, and **adaptive difficulty** that personalizes practice sessions based on historical performance data.

The application is built on a modern React + TypeScript stack with Supabase as the backend, featuring real-time data synchronization, comprehensive analytics dashboards, and a multi-theme design system.

---

## 2. Application Overview

### Core Value Proposition
- **For developers:** Practice typing real code in JavaScript, TypeScript, Python, Java, C#, C++, and Rust
- **For general users:** Touch typing lessons (home row, top row, bottom row, numbers, mixed) and paragraph practice
- **For all users:** AI-generated content, performance tracking, and adaptive difficulty

### Key Metrics Displayed on Landing Page
| Metric | Value |
|--------|-------|
| WPM Record | 150+ |
| Peak Accuracy | 99.8% |
| Tests Taken | 10K+ |
| Supported Languages | 7 |

---

## 3. Technology Stack

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 18.3.1 | UI framework |
| TypeScript | 5.5.3 | Type safety |
| Vite | 5.4.1 | Build tool & dev server |
| Tailwind CSS | 3.4.11 | Utility-first styling |
| shadcn/ui (Radix UI) | Various | Component library (30+ components) |
| Framer Motion | 12.35.1 | Animations & transitions |
| React Router DOM | 6.26.2 | Client-side routing |
| TanStack React Query | 5.56.2 | Server state management |
| Recharts | 2.12.7 | Data visualization |
| React Hook Form + Zod | 7.53.0 / 3.23.8 | Form handling & validation |
| Lucide React | 0.462.0 | Icon library |
| React Markdown | 10.1.0 | Markdown rendering (AI analysis) |

### Backend (Supabase)
| Service | Usage |
|---------|-------|
| PostgreSQL Database | User data, typing test results, profiles |
| Authentication | Email/password auth with session management |
| Edge Functions (Deno) | 4 serverless functions for AI features |
| Storage | Avatar uploads (public 'avatars' bucket) |
| Realtime | Live dashboard updates on new test submissions |

### AI Services
| Provider | Model | Purpose |
|----------|-------|---------|
| Lovable AI Gateway | google/gemini-2.5-flash | Code generation, text generation, error analysis, performance analysis, adaptive practice |

---

## 4. Architecture & System Design

### High-Level Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (React)                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  │ Landing  │ │ Typing   │ │Dashboard │ │Profile │ │
│  │ Page     │ │ Page     │ │ Page     │ │ Page   │ │
│  └──────────┘ └──────────┘ └──────────┘ └────────┘ │
│         │            │            │           │      │
│  ┌──────────────────────────────────────────────┐   │
│  │         Supabase Client SDK                   │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  Supabase    │ │  Supabase    │ │  Supabase    │
│  Auth        │ │  Database    │ │  Edge Funcs  │
│              │ │  (PostgreSQL)│ │  (4 funcs)   │
└──────────────┘ └──────────────┘ └──────────────┘
                                         │
                                         ▼
                                  ┌──────────────┐
                                  │ Lovable AI   │
                                  │ Gateway      │
                                  │ (Gemini 2.5) │
                                  └──────────────┘
```

### State Management Strategy
- **Local component state** (`useState`) for UI interactions and typing test data
- **React Query** for server-state caching (available but lightly used)
- **Supabase Realtime** subscriptions for live dashboard updates
- **Context API** for auth (`AuthProvider`) and theming (`ThemeProvider`)
- **localStorage** for theme persistence

### Data Flow (Typing Test)
1. User selects language/mode and clicks Start
2. Keystrokes captured inline on the code display element (no textarea)
3. WPM and accuracy calculated in real-time per keystroke
4. On completion, results submitted to `typing_tests` table via Supabase
5. Realtime subscription pushes new test to Dashboard without page refresh

---

## 5. Feature Inventory

### 5.1 Typing Practice Modes

#### Touch Typing
- **5 lesson categories:** Home Row, Top Row, Bottom Row, Numbers, Mixed
- **Preset word banks** for each lesson targeting specific key groups
- **AI-generated text** that respects key constraints of each lesson
- **Timer options:** 1m, 3m, 5m, 10m

#### Paragraph Typing
- **8 preset paragraphs** covering diverse topics
- **AI text generation** for fresh 50-80 word paragraphs
- **Timer options:** 1m, 3m, 5m, 10m

#### Code Typing
- **7 programming languages:** JavaScript, TypeScript, Python, Java, C#, C++, Rust
- **AI code generation** via Gemini 2.5 Flash (10-15 lines, no comments)
- **Custom topic input** for targeted code generation
- **Timer options:** 1m, 3m, ∞ (unlimited with manual finish)
- **Tab key support** for proper code indentation
- **Adaptive practice mode** (unlocks after 5 completed tests)

### 5.2 Inline Keystroke Capture System
All three typing modes use a unified inline keystroke approach:
- Keystrokes captured directly on the text display `<div>` element
- No separate textarea — typed characters map 1:1 to displayed text
- **Blinking cursor indicator** shows current typing position
- Auto-scrolls to keep cursor visible
- Auto-focuses on Start
- Prevents paste, copy, cut, drag-and-drop

### 5.3 Real-Time Metrics
| Metric | Calculation |
|--------|------------|
| WPM | `words_typed / elapsed_minutes` |
| Accuracy | `correct_characters / total_characters × 100` |
| Progress | `typed_length / total_text_length × 100` |
| Key Errors | Per-key error count stored as JSONB |

### 5.4 Progress Dashboard
- **Stats Grid:** Avg WPM, Best WPM, Accuracy, Streak (consecutive days)
- **Performance Over Time Chart** (Recharts line chart)
- **Error Analysis by Key Chart** (bar chart)
- **Performance Comparison Chart** (cross-language comparison)
- **Recent Tests List** (last 5 with deduplication)
- **Weekly Goals** tracking (Speed, Accuracy, Practice time)
- **Keyboard Heatmap** — visual representation of error-prone keys
- **AI Error Analysis** — Markdown-rendered insights from Gemini
- **AI Performance Analysis** — trend analysis and recommendations

### 5.5 User Profile
- **Avatar upload** to Supabase Storage (max 5MB, image validation)
- **Display name & username** editing
- **Quick stats** (Total Tests, Avg WPM, Best WPM)
- **Quick action links** to typing and progress pages
- **Account info** display (email, join date)

### 5.6 Theme System
| Theme | Primary Colors |
|-------|---------------|
| Original | Cyan (#00bfff) + Purple glow |
| Sunset | Orange/Coral (#f07030) + Rose |
| Gray Tone | Muted blue-gray monochrome |
| Nature | Forest green (#3db87a) + Lime |

All themes are dark-mode with HSL-based CSS custom properties and smooth transitions.

### 5.7 Authentication
- Email/password sign up and sign in
- Session persistence via Supabase Auth
- Protected features (test submission, AI analysis, adaptive practice)
- GitHub OAuth button present in UI (visual only based on current code)

---

## 6. Database Schema

### `profiles` Table
| Column | Type | Notes |
|--------|------|-------|
| id | UUID (PK) | Auto-generated |
| user_id | UUID (FK → auth.users) | Unique, not null |
| display_name | text | Nullable |
| username | text | Nullable |
| avatar_url | text | Nullable, Supabase Storage URL |
| created_at | timestamptz | Default now() |
| updated_at | timestamptz | Default now() |

### `typing_tests` Table
| Column | Type | Notes |
|--------|------|-------|
| id | UUID (PK) | Auto-generated |
| user_id | UUID (FK → auth.users) | Not null |
| wpm | integer | Words per minute |
| accuracy | numeric | Percentage (0-100) |
| test_duration | integer | Seconds |
| language | text | e.g., "javascript", "touch-typing", "paragraph" |
| character_count | integer | Total characters typed |
| correct_characters | integer | Characters matching target |
| errors | integer | Incorrect characters |
| key_errors | JSONB | Per-key error counts, e.g., `{"a": 3, "s": 1}` |
| created_at | timestamptz | Default now() |
| updated_at | timestamptz | Default now() |

### Database Trigger
- `handle_new_user()` — automatically creates a profile row when a new user signs up via Supabase Auth

---

## 7. AI Integration

### Edge Functions

#### 1. `generate-code`
- **Purpose:** Generate typing content (code or plain text)
- **Auth:** None required (public)
- **Model:** `google/gemini-2.5-flash` via Lovable AI Gateway
- **Modes:**
  - `language: "simple"` → plain text paragraphs (8-12 sentences)
  - `language: "<code-lang>"` → pure executable code (10-15 lines, no comments)
- **Parameters:** `temperature: 0.7`, `max_tokens: 500`

#### 2. `analyze-typing-errors`
- **Purpose:** AI analysis of user's key-level error patterns
- **Auth:** Bearer token required
- **Input:** Fetches user's typing test history from database
- **Output:** Markdown-formatted analysis with improvement suggestions

#### 3. `analyze-performance`
- **Purpose:** Comprehensive performance trend analysis
- **Auth:** Bearer token required
- **Input:** User's complete test history
- **Output:** Markdown report on speed trends, accuracy patterns, recommendations

#### 4. `generate-adaptive-practice`
- **Purpose:** Generate personalized practice content based on weaknesses
- **Auth:** Bearer token required
- **Prerequisite:** Minimum 5 completed tests
- **Output:** Custom text/code targeting user's weak areas with difficulty description

### Error Handling
All edge functions handle:
- 429 Rate Limiting → user-friendly message
- 402 Payment Required → credits notification
- 500 Internal Errors → generic error fallback

---

## 8. User Interface & Design System

### Design Tokens (CSS Custom Properties)
The design system uses HSL-based semantic tokens in `index.css`:
- **Colors:** `--background`, `--foreground`, `--card`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--border`, `--input`, `--ring`
- **Extended tokens:** `--primary-glow`, `--secondary-glow`, `--surface`, `--surface-elevated`
- **Gradients:** `--gradient-primary`, `--gradient-background`, `--gradient-card`
- **Shadows:** `--shadow-glow`, `--shadow-card`, `--shadow-elevated`
- **Patterns:** `--pattern-grid` (SVG data URI)

### Typography
- **Display font:** Space Grotesk (400-700)
- **Monospace font:** JetBrains Mono (400-600) for code, textareas, and typing areas

### shadcn/ui Components Used (30+)
Accordion, Alert Dialog, Alert, Aspect Ratio, Avatar, Badge, Breadcrumb, Button, Calendar, Card, Carousel, Chart, Checkbox, Collapsible, Command, Context Menu, Dialog, Drawer, Dropdown Menu, Form, Hover Card, Input OTP, Input, Label, Menubar, Navigation Menu, Pagination, Popover, Progress, Radio Group, Resizable, Scroll Area, Select, Separator, Sheet, Sidebar, Skeleton, Slider, Sonner, Switch, Table, Tabs, Textarea, Toast, Toggle Group, Toggle, Tooltip

### Animation Strategy
- **Framer Motion** for page transitions, entrance animations, and scroll-triggered reveals
- **CSS transitions** for theme switching, hover states, and color changes
- **CSS `animate-pulse`** for the typing cursor indicator

### Responsive Design
- Mobile-first with breakpoints at `sm` (640px), `md` (768px), `lg` (1024px)
- Mobile hamburger menu via Sheet component
- Adaptive stat layouts (2-col on mobile, 4-col on desktop)
- Hidden elements on small screens with `hidden sm:flex`

---

## 9. Authentication & Security

### Implementation
- **Supabase Auth** with email/password provider
- **AuthProvider** context wraps entire app, providing `user`, `signIn`, `signUp`, `signOut`
- **Session auto-detection** on page load
- **Protected features:** Test submission, AI analysis, profile editing, adaptive practice

### Security Measures
- Anti-cheat: `onPaste`, `onCopy`, `onCut`, `onDrop`, `onDragOver` all prevented on typing areas
- Edge functions validate Bearer tokens for authenticated endpoints
- Avatar uploads validated for file type and size (max 5MB)
- Supabase RLS (Row Level Security) expected on database tables

### Potential Concerns
- The `generate-code` edge function has no authentication requirement — could be abused
- No rate limiting on client-side API calls
- GitHub OAuth button is present but functionality depends on Supabase Auth configuration

---

## 10. Routing & Navigation

| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | Landing | Marketing landing page |
| `/login` | Login | Email/password sign in |
| `/signup` | Signup | User registration |
| `/type` | TypingPage | All typing practice modes |
| `/dashboard` | Dashboard | Progress dashboard |
| `/progressboard` | Dashboard | Alias for dashboard |
| `/multiplayer` | TypingPage | Placeholder (same as /type) |
| `/profile` | Profile | User profile management |
| `/all-tests` | AllTests | Complete test history |
| `/leaderboard` | Redirect → `/progressboard` | Legacy redirect |
| `*` | NotFound | 404 page |

---

## 11. Component Architecture

### Component Tree
```
App
├── ThemeProvider
│   └── AuthProvider
│       ├── Landing
│       │   └── Navbar
│       ├── TypingPage
│       │   ├── Navbar
│       │   ├── TouchTyping (inline keystroke capture)
│       │   ├── ParagraphTyping (inline keystroke capture)
│       │   └── Code Typing (inline keystroke capture)
│       ├── Dashboard
│       │   ├── Navbar
│       │   ├── PerformanceOverTimeChart
│       │   ├── ErrorAnalysisByKeyChart
│       │   ├── PerformanceComparisonChart
│       │   └── KeyboardHeatmap
│       ├── Profile
│       │   └── Navbar
│       └── AllTests
│           └── Navbar
```

### Key Custom Components
| Component | Lines | Responsibility |
|-----------|-------|---------------|
| TypingPage | ~454 | Code typing with AI generation, adaptive mode |
| Dashboard | ~666 | Stats, charts, AI analysis, recent tests |
| TouchTyping | ~278 | Lesson-based typing with inline capture |
| ParagraphTyping | ~252 | Paragraph practice with inline capture |
| Profile | ~484 | User profile CRUD with avatar upload |
| KeyboardHeatmap | ~221 | Visual keyboard error heatmap |
| Navbar | ~201 | Responsive navigation with auth state |
| ThemeSwitcher | ~54 | Theme dropdown selector |

---

## 12. Performance & Optimization

### Current Optimizations
- **Vite** for fast HMR and optimized production builds
- **Code splitting** via React Router (lazy loading possible but not implemented)
- **Realtime subscriptions** for live updates without polling
- **Deduplication** of recent tests in Dashboard
- **Debounced scroll listener** for navbar transparency effect

### Performance Considerations
- Character-by-character rendering in typing display creates many DOM elements (each char is a `<span>`)
- All tests fetched at once for chart data (`allTests` state) — no pagination
- Multiple Supabase queries on Dashboard mount (could be consolidated)
- 30+ shadcn/ui component files imported (tree-shaking handles unused exports)

---

## 13. Strengths

1. **AI-First Approach:** Deep integration of Gemini 2.5 Flash for content generation, error analysis, performance insights, and adaptive difficulty — a genuine differentiator over competitors like MonkeyType
2. **Developer-Focused:** Code typing across 7 languages with proper syntax, indentation, and Tab key support
3. **Inline Keystroke Capture:** Eliminates the textarea alignment problem — typed characters map directly to the displayed code with a visual cursor
4. **Comprehensive Analytics:** Per-key error tracking (JSONB), keyboard heatmap, multi-chart dashboard, and streak tracking
5. **Real-time Updates:** Supabase Realtime ensures the dashboard reflects new tests instantly
6. **Polished Design System:** 4 cohesive themes with HSL tokens, Space Grotesk + JetBrains Mono typography, smooth Framer Motion animations
7. **Anti-Cheat Measures:** Paste/copy/cut/drag prevention on all typing areas

---

## 14. Areas for Improvement

1. **No Route Protection:** All routes are accessible without auth — `/profile` and `/dashboard` should redirect unauthenticated users
2. **Multiplayer is a Placeholder:** `/multiplayer` renders the same TypingPage — no real-time competitive functionality exists
3. **No Lazy Loading:** All page components are eagerly imported in App.tsx
4. **Large Components:** TypingPage (454 lines) and Dashboard (666 lines) exceed maintainability thresholds
5. **Missing Error Boundaries:** No React Error Boundaries for graceful failure handling
6. **No Offline Support:** No service worker or PWA configuration
7. **Test Coverage:** No unit or integration tests exist in the project
8. **Accessibility:** Typing areas use `div[tabIndex=0]` which may not announce state changes to screen readers
9. **SEO:** Missing meta descriptions, Open Graph tags, and structured data on pages
10. **Mobile Typing Experience:** Code typing with inline keystroke capture may be difficult on mobile soft keyboards

---

## 15. Recommendations

### Short-Term (Quick Wins)
- Add route guards for authenticated pages
- Implement `React.lazy()` for code splitting on routes
- Add meta tags and Open Graph data for SEO
- Add loading skeletons to Dashboard charts

### Medium-Term (Feature Enhancement)
- Implement actual multiplayer typing races using Supabase Realtime
- Add a global leaderboard with anonymized rankings
- Implement spaced repetition for weak keys
- Add sound effects/haptic feedback for typing
- PWA support for offline practice with cached content

### Long-Term (Architecture)
- Extract typing logic into a custom `useTypingTest` hook to reduce component sizes
- Add comprehensive test suite (Vitest + React Testing Library)
- Implement React Error Boundaries
- Consider server-side rendering for landing page SEO
- Add rate limiting and authentication to the `generate-code` edge function

---

## Appendix: File Structure Summary

```
src/
├── App.tsx                          # Root with routing
├── main.tsx                         # Entry point
├── index.css                        # Design system tokens (4 themes)
├── components/
│   ├── Navbar.tsx                   # Global navigation
│   ├── ThemeSwitcher.tsx            # Theme dropdown
│   ├── TouchTyping.tsx              # Touch typing mode
│   ├── ParagraphTyping.tsx          # Paragraph mode
│   ├── KeyboardHeatmap.tsx          # Error visualization
│   ├── charts/
│   │   ├── PerformanceOverTimeChart.tsx
│   │   ├── ErrorAnalysisByKeyChart.tsx
│   │   └── PerformanceComparisonChart.tsx
│   └── ui/                          # 30+ shadcn/ui components
├── hooks/
│   ├── useAuth.tsx                  # Auth context & provider
│   ├── useTheme.tsx                 # Theme context & provider
│   ├── use-toast.ts                 # Toast notifications
│   └── use-mobile.tsx               # Mobile detection
├── pages/
│   ├── Landing.tsx                  # Marketing page
│   ├── Login.tsx                    # Sign in
│   ├── Signup.tsx                   # Registration
│   ├── TypingPage.tsx               # All typing modes
│   ├── Dashboard.tsx                # Analytics & progress
│   ├── Profile.tsx                  # User settings
│   ├── AllTests.tsx                 # Test history
│   └── NotFound.tsx                 # 404
├── integrations/supabase/
│   ├── client.ts                    # Supabase client init
│   └── types.ts                     # Generated DB types
└── lib/utils.ts                     # Utility functions

supabase/functions/
├── generate-code/index.ts           # AI content generation
├── analyze-typing-errors/index.ts   # AI error analysis
├── analyze-performance/index.ts     # AI performance insights
└── generate-adaptive-practice/index.ts # Adaptive difficulty
```

---

*This report was generated on March 8, 2026, based on the current codebase of TriggerType.*
