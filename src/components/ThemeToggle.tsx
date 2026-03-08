import { Moon, Sun } from "lucide-react"

import { useTheme } from "@/components/theme-provider"
import { PillButton } from "@/components/ui/PillButton"

export function ThemeToggle() {
    const { theme, setTheme } = useTheme()

    return (
        <PillButton
            variant="ghost"
            size="sm"
            className="w-10 h-10 px-0 rounded-full"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
        </PillButton>
    )
}
