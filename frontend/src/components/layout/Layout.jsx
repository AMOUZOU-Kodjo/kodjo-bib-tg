import { useEffect, useState } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import CommandPalette from "./CommandPalette";

export default function Layout({ children }) {
  const [commandOpen, setCommandOpen] = useState(false);

  useEffect(() => {
    const open = () => setCommandOpen(true);
    window.addEventListener("open-command-palette", open);
    const onKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("open-command-palette", open);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <div className="flex min-h-screen w-full flex-col overflow-x-hidden bg-white text-gray-900 transition-colors dark:bg-slate-900 dark:text-slate-100">
      <Navbar />
      <main className="flex-1 w-full pt-[72px] sm:pt-[76px] lg:pt-[80px]">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
      <Footer />
      <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} />
    </div>
  );
}
