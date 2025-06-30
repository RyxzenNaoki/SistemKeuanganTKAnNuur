# TK An Nuur Rumah Cahaya Financial Management System

A comprehensive financial management system for kindergarten schools built with React, TypeScript, and Firebase.

## Features

### Admin Features
- **Dashboard**: Overview of financial data and school statistics
- **Student Management**: Complete CRUD operations for student data
- **Class Management**: Manage school classes and assignments
- **User Management**: Handle user accounts and permissions
- **Financial Management**: 
  - Income tracking and management
  - Expense tracking and categorization
  - Financial reports and analytics
- **Payment Schedule**: Manage payment deadlines and schedules

### Parent Features
- **Dashboard**: View child's information and payment status
- **Payment History**: Complete payment transaction history
- **Make Payment**: Guided payment process with bank details
- **Upload Payment Proof**: Upload and track payment confirmations
- **Contact Admin**: Direct communication with school administration

## Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Firebase (Firestore, Authentication, Storage)
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React
- **Routing**: React Router DOM
- **Forms**: React Hook Form
- **Date Handling**: date-fns

## Firebase Integration

The application is fully integrated with Firebase services:

### Firestore Database
- **Collections**: students, users, payments, expenses, income
- **Real-time updates**: Automatic data synchronization
- **Security Rules**: Role-based access control

### Authentication
- **Email/Password**: Secure user authentication
- **Role-based Access**: Admin, Bendahara, Guru, Parent roles
- **Password Reset**: Email-based password recovery

### Storage
- **File Uploads**: Payment proofs, documents
- **Image Optimization**: Automatic image processing

## Getting Started

### Prerequisites
- Node.js 18+ 
- Firebase project with Firestore, Authentication, and Storage enabled

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd tk-financial-system
```

2. Install dependencies:
```bash
npm install
```

3. Configure Firebase:
   - Create a Firebase project at https://console.firebase.google.com
   - Enable Authentication, Firestore, and Storage
   - Copy your Firebase configuration
   - Update `src/firebase/config.ts` with your configuration

4. Set up Firestore Security Rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Students - Admin and Bendahara can manage
    match /students/{studentId} {
      allow read, write: if request.auth != null && 
        (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'bendahara']);
    }
    
    // Parents can only read their child's data
    match /students/{studentId} {
      allow read: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'parent' &&
        resource.data.parentEmail == request.auth.token.email;
    }
  }
}
```

5. Start the development server:
```bash
npm run dev
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── admin/          # Admin-specific components
│   ├── parent/         # Parent-specific components
│   └── common/         # Shared components
├── contexts/           # React contexts (Auth, Toast)
├── layouts/            # Page layouts
├── pages/              # Page components
│   ├── admin/          # Admin pages
│   ├── parent/         # Parent pages
│   └── auth/           # Authentication pages
├── services/           # Firebase service layers
├── firebase/           # Firebase configuration
└── types/              # TypeScript type definitions
```

## Key Features Implemented

### Student Management with Firebase
- **Full CRUD Operations**: Create, read, update, delete students
- **Real-time Data**: Automatic updates across all connected clients
- **Advanced Filtering**: Search by name, class, parent, status
- **Data Validation**: Comprehensive form validation
- **Error Handling**: Graceful error handling with user feedback

### Service Layer Architecture
- **StudentService**: Centralized data operations
- **Type Safety**: Full TypeScript integration
- **Error Handling**: Consistent error management
- **Data Transformation**: Automatic date/timestamp conversion

### User Experience
- **Loading States**: Visual feedback during operations
- **Toast Notifications**: Success/error messages
- **Modal Forms**: Intuitive data entry
- **Responsive Design**: Mobile-friendly interface

## Environment Variables

Create a `.env` file in the root directory:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

## Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please contact the development team or create an issue in the repository.