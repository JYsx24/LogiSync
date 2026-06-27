# LogiSync

A real-time inventory management web app built with React and Firebase. Track your stock, organise items into colour-coded folders, get low-stock alerts, and keep everything in sync across devices.

![LogiSync Dashboard](https://github.com/JYsx24/LogiSync/raw/master/preview.png)

## Features

- **Real-time sync** — Firestore keeps data live across all devices without page refresh
- **Inventory management** — Add, edit, delete items with name, SKU, location, quantity, price, and image
- **Folder organisation** — Group items into colour-coded folders with inline creation
- **Low-stock alerts** — Set a threshold per item; the dashboard flags anything running low or out of stock
- **Dashboard stats bar** — Live counts for total SKUs, units, low-stock, and out-of-stock items; collapses to a slim bar when you scroll
- **Grid and list views** — Switch between card grid and compact list; preference is saved
- **CSV export** — Download your full inventory as a spreadsheet in one click
- **Sorting** — Sort by name (A→Z / Z→A) or quantity (high→low / low→high)
- **Image support** — Attach photos to items stored in Firebase Storage
- **Authentication** — Email/password sign-up and login via Firebase Auth
- **Password strength meter** — Live feedback on sign-up and in the password-change form
- **Profile & Settings** — Edit display name, change password with re-authentication, toggle theme and language
- **Light / Dark mode** — Full support for both, persisted to localStorage
- **Bilingual UI** — English and 中文 (Chinese) translations throughout
- **Onboarding tutorial** — 5-step modal shown to new users on first login

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 8 (Rolldown) |
| Styling | Tailwind CSS v4, CSS custom properties |
| Animation | Framer Motion |
| Backend / Auth | Firebase Authentication |
| Database | Cloud Firestore |
| File storage | Firebase Storage |
| Language | JavaScript (ESM) |

## Getting Started

### Prerequisites

- Node.js 18+
- A [Firebase](https://firebase.google.com) project with **Authentication** (Email/Password), **Firestore**, and **Storage** enabled

### 1. Clone the repo

```bash
git clone https://github.com/JYsx24/LogiSync.git
cd LogiSync/web-app
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in `web-app/`:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

You'll find all these values in your Firebase project settings under **Project settings → Your apps → SDK setup**.

### 4. Set Firestore security rules

In the Firebase console → **Firestore → Rules**, paste:

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /items/{itemId} {
      allow read, write: if request.auth != null;
    }
    match /folders/{folderId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### 6. Build for production

```bash
npm run build
```

The output goes to `web-app/dist/`. Deploy to Firebase Hosting, Vercel, or any static host.

## Project Structure

```
LogiSync/
└── web-app/
    ├── src/
    │   ├── App.jsx               # Root component, state, routing, translations
    │   ├── firebase.js           # Firebase initialisation
    │   ├── index.css             # Design tokens, global styles
    │   └── components/
    │       ├── AddEditModal.jsx  # Add / edit item form
    │       ├── ConfirmDialog.jsx # Reusable confirm prompt
    │       ├── DashboardStats.jsx# Stats bar (compact + full)
    │       ├── FolderSidebar.jsx # Folder colour picker swatch
    │       ├── InventoryCard.jsx # Grid and list item cards
    │       ├── ItemDetailView.jsx# Item detail / history view
    │       ├── ProfileSettings.jsx# Profile, security, preferences
    │       ├── Sidebar.jsx       # Left nav (desktop + mobile drawer)
    │       ├── SortBar.jsx       # Sort dropdown
    │       ├── Toast.jsx         # Toast notification system
    │       └── TutorialModal.jsx # First-run onboarding
    ├── .env                      # Your Firebase config (not committed)
    ├── index.html
    ├── vite.config.js
    └── package.json
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you'd like to change.

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push to the branch: `git push origin feat/your-feature`
5. Open a Pull Request against `master`

## License

[MIT](LICENSE)
