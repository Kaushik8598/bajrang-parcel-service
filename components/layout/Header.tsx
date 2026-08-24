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
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/ui/form-input";
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
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  const balance = user?.balance ?? 19846;
  const notifications = 214535; // notifications count

  const handleLogout = () => {
    clearAuthData();
    router.push("/login");
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/transaction/booking?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const formatNotifCount = (n: number) =>
    n > 99999 ? "99k+" : n > 999 ? `${Math.floor(n / 1000)}k+` : String(n);

  return (
    <header
      id="main-header"
      className="sticky top-0 z-20 w-full bg-[#f8fafc] border-b border-slate-200/90 text-slate-800 shadow-xs backdrop-blur-sm transition-all"
    >
      <div className="flex flex-wrap items-center justify-between min-h-14 py-2 px-3 sm:px-6 pr-6 sm:pr-8 md:pr-10 gap-3">
        {/* ─── Left Section: Hamburger Menu (shadcn Button) ───────────────────── */}
        <div className="flex items-center gap-2">
          <Button
            id="header-menu-toggle"
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onMenuToggle}
            aria-label="Toggle sidebar"
            className="text-slate-700 hover:bg-slate-200/70 hover:text-black transition-colors"
          >
            <Menu className="w-5 h-5" />
          </Button>
        </div>

        {/* ─── Middle Section: Search Bar (Common FormInput) ──────────────────── */}
        <div className="order-3 sm:order-2 w-full sm:flex-1 max-w-full sm:max-w-xl mx-0 sm:mx-4">
          <form onSubmit={handleSearchSubmit} className="w-full">
            <FormInput
              id="header-global-search"
              startIcon={<Search className="w-4 h-4 text-slate-400" />}
              placeholder="Search docket, tracking no, customer name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              containerClassName="space-y-0"
            />
          </form>
        </div>

        {/* ─── Right Section: Amount & Actions (shadcn Buttons) ──────────────── */}
        <div className="order-2 sm:order-3 flex items-center gap-2 sm:gap-4 ml-auto sm:ml-0">
          {/* Amount / Balance — Positioned Right, Extra Large Font, Always Visible */}
          <div className="flex flex-col items-end justify-center select-none pr-1">
            <span className="text-lg sm:text-xl md:text-2xl font-black text-black tracking-tight leading-none whitespace-nowrap">
              {formatCurrency(balance)}
            </span>
          </div>

          {/* Vertical Divider */}
          <div className="h-6 w-[1px] bg-slate-200" />

          {/* Action icons group (shadcn Buttons) */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            {/* Notification bell (shadcn Button) */}
            <Button
              id="header-notifications"
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Notifications"
              className="relative text-slate-700 hover:bg-slate-200/70 hover:text-black transition-colors"
            >
              <Bell className="w-5 h-5" />
              {notifications > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] bg-[#e74c3c] text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 leading-none shadow-xs pointer-events-none">
                  {formatNotifCount(notifications)}
                </span>
              )}
            </Button>

            {/* Home (shadcn Button with Link) */}
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => router.push("/dashboard")}
              aria-label="Home"
              className="text-slate-700 hover:bg-slate-200/70 hover:text-black transition-colors"
            >
              <Home className="w-5 h-5" />
            </Button>
          </div>

          {/* Vertical Divider */}
          <div className="h-6 w-[1px] bg-slate-200 hidden sm:block" />

          {/* User dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger
              id="header-user-menu"
              className="flex items-center gap-2 pl-1.5 pr-1 py-1 rounded-lg hover:bg-slate-200/70 transition-colors outline-none cursor-pointer"
            >
              <Avatar className="w-7 h-7 ring-1 ring-slate-200 shadow-2xs">
                <AvatarFallback className="bg-[#2980b9] text-white text-xs font-bold">
                  {user ? getInitials(user.name) : "A"}
                </AvatarFallback>
              </Avatar>
              <span className="hidden md:block text-xs font-bold text-black max-w-[110px] truncate">
                {user?.name || "Admin"}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-700" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-white border border-slate-200 shadow-lg rounded-xl p-1">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="font-normal px-2 py-1.5">
                  <p className="text-[10px] uppercase font-semibold text-slate-500">Signed in as</p>
                  <p className="font-bold text-xs text-black truncate">{user?.name || "Admin"}</p>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  id="header-profile"
                  onClick={() => router.push("/profile")}
                  className="cursor-pointer text-xs font-semibold text-black hover:bg-slate-100 rounded-md"
                >
                  <UserIcon className="w-4 h-4 mr-2 text-slate-700" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem
                  id="header-settings"
                  onClick={() => router.push("/website-settings")}
                  className="cursor-pointer text-xs font-semibold text-black hover:bg-slate-100 rounded-md"
                >
                  <Settings className="w-4 h-4 mr-2 text-slate-700" />
                  Settings
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  id="header-logout"
                  onClick={handleLogout}
                  className="text-[#e74c3c] focus:text-[#e74c3c] cursor-pointer text-xs font-semibold hover:bg-red-50 rounded-md"
                >
                  <LogOut className="w-4 h-4 mr-2 text-[#e74c3c]" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
