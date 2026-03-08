import { Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme, ThemeName } from "@/hooks/useTheme";

const themes: { name: ThemeName; label: string; colors: string[] }[] = [
  { name: "original", label: "Original", colors: ["hsl(195,100%,60%)", "hsl(280,100%,70%)"] },
  { name: "sunset", label: "Sunset", colors: ["hsl(24,95%,58%)", "hsl(350,85%,65%)"] },
  { name: "calm-ocean", label: "Calm Ocean", colors: ["hsl(190,70%,50%)", "hsl(210,60%,55%)"] },
  { name: "gray-tone", label: "Gray Tone", colors: ["hsl(220,10%,60%)", "hsl(220,8%,45%)"] },
];

export const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Palette className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {themes.map((t) => (
          <DropdownMenuItem
            key={t.name}
            onClick={() => setTheme(t.name)}
            className={`flex items-center gap-3 cursor-pointer ${
              theme === t.name ? "bg-accent/20 font-semibold" : ""
            }`}
          >
            <div className="flex gap-1">
              {t.colors.map((c, i) => (
                <div
                  key={i}
                  className="w-3 h-3 rounded-full border border-border"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <span>{t.label}</span>
            {theme === t.name && (
              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
