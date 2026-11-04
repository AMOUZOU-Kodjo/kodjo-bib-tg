import Navbar from "./Navbar";
import Footer from "./Footer";
import InstallBanner from "./InstallBanner";

export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen w-full flex-col overflow-x-hidden bg-white text-gray-900 transition-colors dark:bg-slate-900 dark:text-slate-100">
      <InstallBanner />
      <Navbar />
      <main className="flex-1 w-full">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
