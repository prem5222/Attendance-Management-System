# AttendGuard - Smart Employee Attendance Management System

AttendGuard is a modern, highly secure, and intuitive employee attendance management system built with Next.js, Firebase, and AI-powered Facial Recognition. It ensures that employees can only check in or out by matching their actual face against a high-definition 8-point facial biometric system, preventing buddy punching and time theft.

## 🚀 Live Demo
**Production URL:** [https://attendance-system-beige-six.vercel.app](https://attendance-system-beige-six.vercel.app)

## ✨ Key Features

### 🔐 Strict Biometric Face Verification
- **Anti-Spoofing & HD Capture:** Enforces 720p HD camera requirements to capture clear facial descriptors.
- **8-Point Registration System:** Ensures full 3D facial mapping by guiding users to capture multiple angles during registration.
- **Strict Verification:** Requires 3 consecutive strict matches (using advanced Euclidean distance thresholds) for successful check-ins and check-outs.
- **Instant Visual Feedback:** Shows bounding boxes and real-time mismatch/success alerts.

### 👥 Comprehensive Dashboards
- **Admin Dashboard:** Total control over employee records, real-time attendance statistics, absent/late reports, and system settings.
- **Employee Dashboard:** Beautifully designed metrics, attendance history logs, and profile management with a fully responsive mobile-first UI.
- **Dynamic Stats:** True real-time calculations of working hours, check-in status, and monthly percentages with 0 faked data.

### ⚡ Optimized & Modern Tech Stack
- **Next.js App Router:** Optimized loading, SEO best practices, and fast client-side navigation.
- **Tailwind CSS & Framer Motion:** Premium dark-mode UI with smooth micro-animations, glassmorphism, and responsive design.
- **Firebase Backend:** Fully secure authentication (Auth) and real-time database (Firestore).

## 🛠️ Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/prem5222/Attendance-Management-System.git
   cd Attendance-Management-System
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Firebase Environment Variables:**
   Create a `.env.local` file in the root directory and add your Firebase credentials:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```

4. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📦 Deployment (Vercel)

This app is optimized for Vercel deployment. Since Vercel requires environment variables to be set for Next.js to successfully build static pages, you can easily deploy via the CLI:
```bash
# Build locally using your .env.local variables
npx vercel build --prod --yes

# Deploy the prebuilt output to Vercel
npx vercel deploy --prebuilt --prod --yes
```

## 🔒 Security Architecture
- **Protected Routes:** Unauthorized users are instantly redirected.
- **Role-Based Access Control (RBAC):** Admin and Employee roles have strictly segmented views and backend Firestore rules.
- **Firestore Security Rules:** Secures all collections so employees can only read/write their own biometric and attendance data, while admins get full organizational oversight.

---
Built with ❤️ using Next.js and face-api.js.
