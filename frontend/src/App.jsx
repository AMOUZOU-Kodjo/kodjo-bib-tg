import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import ProtectedRoute from "./routes/ProtectedRoute";
import AdminRoute from "./routes/AdminRoute";

const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Documents = lazy(() => import("./pages/Documents"));
const DocumentDetail = lazy(() => import("./pages/DocumentDetail"));
const Author = lazy(() => import("./pages/Author"));
const SharedDocument = lazy(() => import("./pages/SharedDocument"));
const Upload = lazy(() => import("./pages/Upload"));
const Profile = lazy(() => import("./pages/Profile"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Contact = lazy(() => import("./pages/Contact"));
const MentionsLegales = lazy(() => import("./pages/MentionsLegales"));
const Confidentialite = lazy(() => import("./pages/Confidentialite"));
const CGU = lazy(() => import("./pages/CGU"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));

function PageFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center gap-3 text-sm text-gray-500">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
      Chargement...
    </div>
  );
}

export default function App() {
  return (
    <Layout>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/documents/:id" element={<DocumentDetail />} />
          <Route path="/authors/:id" element={<Author />} />
          <Route path="/share/:token" element={<SharedDocument />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/upload" element={<ProtectedRoute><Upload /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute requireVerified={false}><Profile /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute requireVerified={false}><Notifications /></ProtectedRoute>} />
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/mentions-legales" element={<MentionsLegales />} />
          <Route path="/confidentialite" element={<Confidentialite />} />
          <Route path="/cgu" element={<CGU />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}
