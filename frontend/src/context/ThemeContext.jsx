import { createContext, useContext, useState, useEffect } from "react";

export const ThemeContext = createContext("light");

export const useTheme = () => {
  const c = useContext(ThemeContext);
  return { theme: c, setTheme: c.setTheme };
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem("theme");
    return stored || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  });

  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
};
