import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type ThemeName = "original" | "sunset" | "gray-tone" | "nature";

interface ThemeContextType {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "original",
  setTheme: () => {},
});

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<ThemeName>(() => {
    return (localStorage.getItem("triggertype-theme") as ThemeName) || "original";
  });

  useEffect(() => {
    localStorage.setItem("triggertype-theme", theme);
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
