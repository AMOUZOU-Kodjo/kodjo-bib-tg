import Navbar from "./Navbar";
import Footer from "./Footer";
import InstallBanner from "./InstallBanner";

export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-white text-gray-900 transition-colors dark:bg-slate-900 dark:text-slate-100">
      <InstallBanner />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
