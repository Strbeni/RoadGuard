
# 🚗 RoadGuard - 24/7 Roadside Assistance

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18.2.0-61DAFB?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0.0-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-9.22.0-FFCA28?logo=firebase)](https://firebase.google.com/)

## Demo Video Link

- **Link**: https://drive.google.com/file/d/1oQ6x2d95gXlghxzrMR8cqVEg5eBVC3Jo/view?usp=sharing
Watch in 2x please.

RoadGuard is a modern web application that connects users in need of emergency roadside assistance with nearby available mechanics. The platform provides real-time tracking, service requests, and efficient dispatching of assistance.

## 🌟 Features

- **User Authentication**: Secure signup and login for both users and mechanics
- **Real-time Location Tracking**: Track nearby mechanics in real-time
- **Service Requests**: Request various roadside assistance services
- **Admin Dashboard**: Manage users, mechanics, and service requests
- **Real-time Chat**: Direct messaging between users and mechanics
- **Service History**: Track completed service requests
- **Responsive Design**: Works on desktop and mobile devices

## 🛠️ Tech Stack

- **Frontend**: 
  - React 18 with TypeScript
  - Vite for fast development builds
  - Tailwind CSS for styling
  - React Query for server state management
  - React Router for navigation
  - React Leaflet for maps

- **Backend**:
  - Firebase Authentication
  - Firestore Database
  - Firebase Cloud Messaging (FCM) for push notifications
  - Firebase Cloud Storage

- **UI Components**:
  - Shadcn UI components
  - Lucide Icons
  - React Hot Toast for notifications

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ and npm/yarn
- Firebase account and project setup
- Google Maps API key (for map functionality)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/roadguard.git
   cd roadguard
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory and add your Firebase configuration:
   ```env
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-bucket.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
   ```

4. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

## 📱 Available Scripts

- `dev`: Start development server
- `build`: Build for production
- `preview`: Preview production build
- `test`: Run tests
- `lint`: Run ESLint
- `format`: Format code with Prettier

## 📂 Project Structure

```
src/
├── components/        # Reusable UI components
├── contexts/         # React contexts
├── hooks/            # Custom React hooks
├── lib/              # Utility functions and configurations
├── pages/            # Page components
│   ├── auth/         # Authentication pages
│   ├── dashboard/    # Dashboard pages
│   └── ...
├── services/         # API and service layer
│   ├── auth.ts       # Authentication service
│   ├── chat.ts       # Chat service
│   └── ...
└── styles/           # Global styles
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team Members

> Amit Yadav
> Mohd Shakib
> Naazneet Mahal
> Kartikeya Gupta

## 🙏 Acknowledgments

- [Create React App](https://create-react-app.dev/)
- [Firebase](https://firebase.google.com/)
- [Tailwind CSS](https://tailwindcss.com/)
<<<<<<< HEAD
- [Shadcn UI](https://ui.shadcn.com/)
=======
- [Shadcn UI](https://ui.shadcn.com/)
>>>>>>> 489505086ca5d4090b00c100e1253e65efe5f464
