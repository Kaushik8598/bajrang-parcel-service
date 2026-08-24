"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Menu,
  Bell,
  Home,
  LogOut,
  User as UserIcon,
  Settings,
  ChevronDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatCurrency, getInitials } from "@/lib/utils";
import { getStoredUser, clearAuthData } from "@/lib/api/auth";
import type { User } from "@/lib/types/auth";
import Link from "next/link";

interface HeaderProps {
  onMenuToggle: () => void;
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const balance = 3905;       // TODO: fetch from API
  const notifications = 214535; // TODO: fetch from API

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  const handleLogout = () => {
    clearAuthData();
    router.push("/login");
  };

  const formatNotifCount = (n: number) =>
    n > 99999 ? "99k+" : n > 999 ? `${Math.floor(n / 1000)}k+` : String(n);

  return (
    <header
      id="main-header"
      className="sticky top-0 z-20 flex items-center justify-between h-14 px-4 bg-[#2c3e50] text-white shadow-lg shadow-black/20"
    >
      {/* Left — hamburger */}
      <button
        id="header-menu-toggle"
        onClick={onMenuToggle}
        aria-label="Toggle sidebar"
        className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Right — balance, notifications, home, profile */}
      <div className="flex items-center gap-3">
        {/* Balance */}
        <div className="hidden sm:flex items-center bg-white/10 rounded-lg px-3 py-1.5 text-sm font-semibold tracking-wide">
          {formatCurrency(balance)}
        </div>

        {/* Notification bell */}
        <button
          id="header-notifications"
          aria-label="Notifications"
          className="relative p-1.5 rounded-lg hover:bg-white/10 transition-colors"
        >
          <Bell className="w-5 h-5" />
          {notifications > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-[#e74c3c] text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
              {formatNotifCount(notifications)}
            </span>
          )}
        </button>

        {/* Home */}
        <Link
          href="/dashboard"
          id="header-home"
          aria-label="Home"
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
        >
          <Home className="w-5 h-5" />
        </Link>

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger
            id="header-user-menu"
            className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-lg hover:bg-white/10 transition-colors outline-none"
          >
            <Avatar className="w-7 h-7">
              <AvatarFallback className="bg-[#3498db] text-white text-xs font-bold">
                {user ? getInitials(user.name) : "A"}
              </AvatarFallback>
            </Avatar>
            <span className="hidden sm:block text-sm font-medium max-w-[100px] truncate">
              {user?.name || "Admin"}
            </span>
            <ChevronDown className="w-3.5 h-3.5 opacity-60" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-normal">
                <p className="text-xs text-muted-foreground">Signed in as</p>
                <p className="font-semibold truncate">{user?.name || "Admin"}</p>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem id="header-profile" onClick={() => router.push("/profile")} className="cursor-pointer">
                <UserIcon className="w-4 h-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem id="header-settings" onClick={() => router.push("/website-settings")} className="cursor-pointer">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                id="header-logout"
                onClick={handleLogout}
                className="text-[#e74c3c] focus:text-[#e74c3c] cursor-pointer"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
