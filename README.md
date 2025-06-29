# Vexcel - VEX Robotics Learning Platform

A comprehensive platform for VEX robotics education with interactive lessons, team collaboration, and gamified learning experiences.

## Features

- **Interactive Lessons**: Comprehensive VEX robotics curriculum with hands-on activities
- **Team Collaboration**: Join teams, track progress, and learn together
- **Gamified Learning**: Earn XP, unlock achievements, and compete with others
- **Progress Tracking**: Detailed analytics on lesson completion and performance
- **Captain Dashboard**: Team captains can assign lessons and monitor student progress
- **OAuth Authentication**: Secure Google Sign-In integration
- **Real-time Data**: Firebase integration for live data synchronization

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **Icons**: Lucide React
- **Routing**: React Router DOM
- **Build Tool**: Vite

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Firebase project with Authentication and Firestore enabled

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd vexcel-platform
```

2. Install dependencies:
```bash
npm install
```

3. Set up Firebase:
   - Create a new Firebase project at https://console.firebase.google.com
   - Enable Authentication with Google provider
   - Enable Firestore Database
   - Enable Storage (optional)
   - Copy your Firebase config

4. Create environment file:
```bash
cp .env.example .env
```

5. Add your Firebase configuration to `.env`:
```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

6. Start the development server:
```bash
npm run dev
```

### Firebase Setup

#### Authentication
1. Go to Firebase Console > Authentication > Sign-in method
2. Enable Google sign-in provider
3. Add your domain to authorized domains

#### Firestore Database
1. Go to Firebase Console > Firestore Database
2. Create database in production mode
3. Set up security rules (see below)

#### Security Rules
```javascript
// Firestore Security Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Team members can read team data
    match /teams/{teamId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        (resource.data.captainId == request.auth.uid || 
         request.auth.uid in resource.data.memberIds);
    }
    
    // Lessons are public read, admin write
    match /lessons/{lessonId} {
      allow read: if request.auth != null;
      allow write: if false; // Only admins can write lessons
    }
    
    // Users can read/write their own lesson progress
    match /lessonProgress/{progressId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
  }
}
```

## Project Structure

```
src/
├── components/          # Reusable UI components
├── contexts/           # React contexts (Auth, Theme)
├── pages/              # Page components
├── services/           # Firebase service functions
├── types/              # TypeScript type definitions
├── config/             # Configuration files
└── data/               # Mock data (for development)
```

## Key Features

### Authentication
- Google OAuth integration
- Automatic user profile creation
- Persistent login state
- Role-based access (student/captain)

### User Management
- Profile management
- Progress tracking
- Achievement system
- XP and leveling system

### Team System
- Create and join teams
- Team leaderboards
- Captain dashboard
- Lesson assignments

### Lesson System
- Interactive content
- Progress tracking
- Quiz system
- Time tracking

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Environment Variables

All environment variables should be prefixed with `VITE_` to be accessible in the frontend.

## Deployment

The app can be deployed to any static hosting service like Netlify, Vercel, or Firebase Hosting.

For Firebase Hosting:
```bash
npm run build
firebase deploy
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.