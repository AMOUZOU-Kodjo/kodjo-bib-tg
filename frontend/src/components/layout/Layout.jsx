import Navbar from "./Navbar";
import Footer from "./Footer";
import CookieConsent from "../ui/CookieConsent";

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-50 flex flex-col">
      <Navbar />
      <main className="w-full min-w-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 flex-1">{children}</main>
      <CookieConsent />
      <Footer />
    </div>
  );
}
