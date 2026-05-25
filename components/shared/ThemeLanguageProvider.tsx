// components/shared/ThemeLanguageProvider.tsx
"use client";

import { useEffect, useState } from "react";
import { useSettingsStore } from "@/store/settings";

export default function ThemeLanguageProvider({ children }: { children: React.ReactNode }) {
    const { theme, lang } = useSettingsStore();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (!isMounted) return;
        const root = document.documentElement;
        
        // Handle Theme
        if (theme === "dark") {
            root.classList.add("dark");
            root.style.colorScheme = "dark";
        } else {
            root.classList.remove("dark");
            root.style.colorScheme = "light";
        }

        // Handle Language & Direction
        root.setAttribute("lang", lang);
        if (lang === "ar") {
            root.setAttribute("dir", "rtl");
        } else {
            root.setAttribute("dir", "ltr");
        }
    }, [theme, lang, isMounted]);

    return <>{children}</>;
}
