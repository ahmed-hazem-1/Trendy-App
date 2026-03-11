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

---

## Deploying to Google Cloud Run

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) installed locally
- [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) (`gcloud`) installed and authenticated
- A Google Cloud project with **Cloud Run**, **Cloud Build**, and **Container Registry** APIs enabled

### Environment Variables

> **Important:** Vite bakes `VITE_*` variables into the JS bundle **at build time**. They must be passed as Docker `--build-arg` values — they are **not** runtime secrets and should not contain highly sensitive data (only the Supabase anon key, which is already public-facing).

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Your Supabase anon (publishable) key |

---

### One-time GCP setup (run once per project)

```bash
PROJECT_ID=YOUR_PROJECT_ID
REGION=us-central1
BUILD_SA="$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')@cloudbuild.gserviceaccount.com"

# Create Artifact Registry Docker repo
gcloud artifacts repositories create trendy \
  --repository-format=docker \
  --location=$REGION \
  --project=$PROJECT_ID

# Grant Cloud Build SA permission to push images
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${BUILD_SA}" \
  --role="roles/artifactregistry.writer"

# Grant Cloud Build SA permission to deploy to Cloud Run
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${BUILD_SA}" \
  --role="roles/run.admin"

# Allow Cloud Build to act as the Compute default SA (required for Cloud Run deploy)
gcloud iam service-accounts add-iam-policy-binding \
  "$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')-compute@developer.gserviceaccount.com" \
  --member="serviceAccount:${BUILD_SA}" \
  --role="roles/iam.serviceAccountUser"
```

---

### Option A — Manual deploy

```bash
PROJECT_ID=YOUR_PROJECT_ID
REGION=us-central1

# 1. Authenticate Docker with Artifact Registry
gcloud auth configure-docker ${REGION}-docker.pkg.dev

# 2. Build the image with Vite env vars baked in
docker build \
  --build-arg VITE_SUPABASE_URL="https://xxxx.supabase.co" \
  --build-arg VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGc..." \
  -t ${REGION}-docker.pkg.dev/${PROJECT_ID}/trendy/trendy-app:latest \
  .

# 3. Push to Artifact Registry
docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/trendy/trendy-app:latest

# 4. Deploy to Cloud Run
gcloud run deploy trendy-app \
  --image ${REGION}-docker.pkg.dev/${PROJECT_ID}/trendy/trendy-app:latest \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --memory 256Mi \
  --cpu 1
```

Replace `YOUR_PROJECT_ID` with your GCP project ID.

---

### Option B — Automated CI/CD via Cloud Build

The repo includes `cloudbuild.yaml`. Connect it to a Cloud Build trigger on the `main` branch:

1. Open **Cloud Build → Triggers → Create Trigger**
2. Connect your GitHub repo and point it to `cloudbuild.yaml`
3. Add the following **substitution variables** in the trigger config:

| Variable | Example value |
|---|---|
| `_VITE_SUPABASE_URL` | `https://xxxx.supabase.co` |
| `_VITE_SUPABASE_PUBLISHABLE_KEY` | `eyJhbGc...` |
| `_REGION` | `us-central1` |
| `_SERVICE` | `trendy-app` |
| `_AR_REPO` | `trendy` |

Every push to `main` will automatically build, push, and deploy the container.

---

### Local Docker test (optional)

```bash
docker build \
  --build-arg VITE_SUPABASE_URL="https://xxxx.supabase.co" \
  --build-arg VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGc..." \
  -t trendy-app .

docker run -p 8080:8080 -e PORT=8080 trendy-app
# App is now available at http://localhost:8080
```

---

## License

This project is proprietary. All rights reserved.
