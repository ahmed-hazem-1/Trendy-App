# Trendy — Front-End

A modern Arabic news verification and social feed platform built with React. Trendy helps users browse, verify, and share news while providing trustworthiness indicators and community engagement tools.

## Features

- **News Feed** — Browse trending and categorized news with filtering tabs
- **Post Details** — View full articles with verification status badges
- **User Profiles** — Editable profiles with interests, bio, and personal info
- **Authentication** — Login and signup flows with form validation
- **Responsive Design** — Fully responsive layout across mobile, tablet, and desktop
- **Ad System** — Contextual sidebar and mobile ad placements
- **Trending Sidebar** — Real-time trending topics panel
- **Search & Notifications** — Integrated search bar and notification bell

## Tech Stack

| Category         | Technology                  |
| ---------------- | --------------------------- |
| Framework        | React 19                    |
| Bundler          | Vite 7                      |
| Styling          | Tailwind CSS 4              |
| Routing          | React Router v7             |
| State Management | Redux Toolkit / React Query |
| Forms            | React Hook Form             |
| Icons            | Lucide React                |
| Backend          | Supabase                    |
| HTTP Client      | Axios                       |

## Project Structure

```
src/
├── pages/          # Route-level page components (Feed, Login, Signup, Profile, Posts)
├── features/       # Feature-specific components (feed cards, sidebars, modals)
├── UI/             # Shared UI components (NavBar, Button, FormInput, Ads, etc.)
├── services/       # API and backend service modules
├── hooks/          # Custom React hooks
├── utils/          # Constants, helpers, and shared data
├── Schema/         # Database schema references
├── App.jsx         # Root component with route definitions
├── main.jsx        # Entry point
└── index.css       # Global styles
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd Front-End

# Install dependencies
npm install
```

### Environment Variables

Create a `.env` file in the project root with the required environment variables. Refer to the Supabase documentation for the necessary configuration keys.

### Development

```bash
# Start the dev server
npm run dev
```

### Build

```bash
# Create a production build
npm run build

# Preview the production build locally
npm run preview
```

### Linting

```bash
npm run lint
```

## Routes

| Path           | Description                 |
| -------------- | --------------------------- |
| `/login`       | User login page             |
| `/signup`      | User registration page      |
| `/feed`        | Main news feed              |
| `/profile/:id` | User profile page           |
| `/posts/:id`   | Individual post detail page |

## License

This project is proprietary. All rights reserved.
