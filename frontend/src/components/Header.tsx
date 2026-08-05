"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "../context/AppContext";
import { translations } from "../translations";
import { Droplet, Sun, Moon, Wifi, WifiOff, Play, BookOpen, Shield, Square } from "lucide-react";

interface HeaderProps {
  isConnected?: boolean;
  onSimulate?: () => void;
  simulating?: boolean;
  isAdminMode?: boolean;
  onTitleClick?: () => void;
}

export default function Header({ isConnected, onSimulate, simulating, isAdminMode, onTitleClick }: HeaderProps) {
  const pathname = usePathname();
  const { theme, lang, toggleTheme, toggleLang } = useApp();
  const t = translations[lang];

  return (
    <header className="border-b border-zinc-200 dark:border-zinc-850 bg-white/80 dark:bg-zinc-900/50 backdrop-blur-md sticky top-0 z-40">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-600/10 rounded-xl text-emerald-600 dark:text-emerald-500 border border-emerald-500/20">
            <Droplet className="h-6 w-6" />
          </div>
          <div>
            <h1
              onClick={onTitleClick}
              className="text-xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent cursor-pointer select-none flex items-center gap-1.5"
            >
              {t.title}
              {isAdminMode && (
                <Shield className="h-4.5 w-4.5 text-indigo-650 dark:text-indigo-400 animate-pulse inline-block" />
              )}
            </h1>
            <p className="text-xs text-zinc-550 dark:text-zinc-400 font-medium">
              {t.subtitle}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <nav className="flex items-center gap-2 bg-zinc-150 dark:bg-zinc-800/80 p-1 rounded-lg border border-zinc-200 dark:border-zinc-700/50">
            <Link
              href="/"
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                pathname === "/"
                  ? "bg-white dark:bg-zinc-900 shadow-sm text-emerald-600 dark:text-emerald-400"
                  : "text-zinc-650 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              {t.dashboard}
            </Link>
            <Link
              href="/tutorial"
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                pathname === "/tutorial"
                  ? "bg-white dark:bg-zinc-900 shadow-sm text-emerald-600 dark:text-emerald-400"
                  : "text-zinc-650 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              <span className="flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5" />
                {t.tutorial}
              </span>
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleLang}
              className="px-2.5 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-bold transition-colors border border-zinc-250 dark:border-zinc-700"
            >
              {lang.toUpperCase()}
            </button>

            <button
              onClick={toggleTheme}
              className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg transition-colors border border-zinc-250 dark:border-zinc-700"
              aria-label="Toggle Theme"
            >
              {theme === "dark" ? (
                <Sun className="h-4.5 w-4.5 text-amber-400" />
              ) : (
                <Moon className="h-4.5 w-4.5 text-zinc-700" />
              )}
            </button>

            {onSimulate && (
              <button
                onClick={onSimulate}
                className={`flex items-center gap-2 px-4 py-2 font-semibold text-xs rounded-lg transition-all shadow-md ${
                  simulating
                    ? "bg-red-600 hover:bg-red-500 text-white shadow-red-950/20"
                    : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/20"
                }`}
              >
                {simulating ? (
                  <Square className="h-3.5 w-3.5" />
                ) : (
                  <Play className="h-3.5 w-3.5" />
                )}
                <span>{simulating ? t.stopSimulate : t.simulate}</span>
              </button>
            )}

            {isConnected !== undefined && (
              <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800/80 px-3.5 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700/50">
                {isConnected ? (
                  <>
                    <Wifi className="h-4 w-4 text-emerald-500 animate-pulse" />
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-500">
                      {t.connected}
                    </span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-4 w-4 text-red-500" />
                    <span className="text-xs font-semibold text-red-500">
                      {t.disconnected}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
