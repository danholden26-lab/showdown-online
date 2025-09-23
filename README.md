# ⚾ MLB Showdown Web App

A React + Firebase web app for playing MLB Showdown with friends.  
Supports user authentication, games list, and a simple **Suggestions/Notes** feature so testers can leave feedback directly in the app.

---

## 🚀 Features
- Firebase Authentication (anonymous sign-in supported)
- Firestore for storing games and notes
- Static card data served via `cards.json`
- Simple **Notes** section for testers to leave feedback
- Deployable for free on Firebase Hosting

---

## 🛠️ Local Development Setup

### 1. Clone the Repo
```bash
git clone https://github.com/your-username/mlb-showdown.git
cd mlb-showdown
```

### 2. Install Dependencies
```
npm install
```

### 3. Firebase Setup
- Go to Firebase Console
- Create a project.
- Enable:
  - **Authentication**
  - **Firestore Database**
  - **Hosting** (optional if you want to deploy)

### 4. Firestore Rules
Make sure your Firestore Rules allow notes to be created by logged-in users (including anonymous):
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /notes/{noteId} {
      allow read: if true;
      allow create: if request.auth != null;
    }
  }
}
```

▶️ Running Locally
Start the development server:
```
npm start
```
The app will run at http://localhost:3000

🌍 Deploying to Firebase Hosting
### 1. Build the Project
```
npm run build
```

### 2. Install Firebase CLI (if not installed)
```
npm install -g firebase-tools
firebase login
```

### 3. Initialize (first time only)
```
firebase init
```
- Choose Hosting
- Use build as the public folder
- Configure as SPA: **Yes**

### 4. Deploy
```
firebase deploy
```
Your app will be available at:
```
https://your-project-name.web.app
```

## 💡 Suggestions / Notes Feature
We’ve added a simple Notes section inside the app so testers can leave feedback while playing.

### How it Works
- Anyone signed in (including anonymous login) can add a note.
- Notes appear instantly for everyone — no refresh needed.
- Notes cannot be deleted/edited (kept lightweight for now).

### How to Use
- Run the app locally or visit the deployed link.
- Scroll down to the 💡 Suggestions & Notes section.
- Type your feedback (ideas, bugs, improvements, card suggestions).
- Click Add — your note is saved and appears in the list.

### Example
```
💡 Suggestions & Notes
----------------------

[ input box here ]
[ Add button ]

📌 Notes:
- "Pitchers should have stamina rules"
- "We need a left-handed batter card"
```

### Developer Notes
- Notes are stored in Firestore in the notes collection.
- Each note contains:
    - text → the suggestion text
    - createdAt → timestamp of creation
    - userId → Firebase user ID (or "anon")
