"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Settings,
  ChevronDown,
  ChevronRight,
  Users,
  GitBranch,
  Truck,
  UserCheck,
  FileText,
  BarChart3,
  Globe,
  ShieldCheck,
  Package,
  CreditCard,
  UserCog,
  X,
  PanelLeftClose,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getStoredUser, getStoredPermissions, getStoredMenu } from "@/lib/api/auth";
import type { MenuItem, Permission, User } from "@/lib/types/auth";

// ─── Width constants ──────────────────────────────────────────────────────────
export const SIDEBAR_EXPANDED_W = 256;
export const SIDEBAR_COLLAPSED_W = 64;

// ─── Icon map ─────────────────────────────────────────────────────────────────
const ICON_MAP: Record<string, React.ElementType> = {
  dashboard: LayoutDashboard,
  master: Settings,
  "manage-admin": UserCog,
  "admin-wise-payment": CreditCard,
  "manage-branch": GitBranch,
  "manage-branch-user": Users,
  "manage-customer": UserCheck,
  "manage-truck": Truck,
  "manage-driver": Package,
  transaction: FileText,
  reports: BarChart3,
  "manage-user-rights": ShieldCheck,
  "website-settings": Globe,
};

// ─── Default menu ─────────────────────────────────────────────────────────────
const DEFAULT_MENU: MenuItem[] = [
  { id: "dashboard", label: "Dashboard", path: "/dashboard", icon: "dashboard" },
  {
    id: "master",
    label: "Master",
    icon: "master",
    children: [
      { id: "manage-admin", label: "Manage Admin", path: "/master/admin", permission_module: "manage_admin" },
      { id: "admin-wise-payment", label: "Admin wise payment", path: "/master/admin-payment", permission_module: "admin_wise_payment" },
      { id: "manage-branch", label: "Manage Branch", path: "/master/branch", permission_module: "manage_branch" },
      { id: "manage-branch-user", label: "Manage Branch User", path: "/master/branch-user", permission_module: "manage_branch_user" },
      { id: "manage-customer", label: "Manage Customer", path: "/master/customer", permission_module: "manage_customer" },
      { id: "manage-truck", label: "Manage Truck", path: "/master/truck", permission_module: "manage_truck" },
      { id: "manage-driver", label: "Manage Driver", path: "/master/driver", permission_module: "manage_driver" },
    ],
  },
  {
    id: "transaction",
    label: "Transaction",
    icon: "transaction",
    children: [
      { id: "booking", label: "Booking", path: "/transaction/booking", permission_module: "booking" },
      { id: "delivery", label: "Delivery", path: "/transaction/delivery", permission_module: "delivery" },
      { id: "memo", label: "Memo", path: "/transaction/memo", permission_module: "memo" },
    ],
  },
  {
    id: "reports",
    label: "Reports",
    icon: "reports",
    children: [
      { id: "booking-report", label: "Booking Report", path: "/reports/booking", permission_module: "booking_report" },
      { id: "delivery-report", label: "Delivery Report", path: "/reports/delivery", permission_module: "delivery_report" },
    ],
  },
  { id: "manage-user-rights", label: "Manage User Rights", path: "/user-rights", icon: "manage-user-rights", permission_module: "manage_user_rights" },
  { id: "website-settings", label: "Website Settings", path: "/website-settings", icon: "website-settings", permission_module: "website_settings" },
];

// ─── Props ─────────────────────────────────────────────────────────────────────
interface SidebarProps {
  isOpen: boolean;       // desktop: true=expanded, false=icon-only | mobile: true=drawer open
  onClose: () => void;   // mobile: close drawer
  onExpand: () => void;  // desktop: expand from icon-only mode
}

// ─── Permission check ─────────────────────────────────────────────────────────
function isMenuVisible(item: MenuItem, permissions: Permission[]): boolean {
  if (!item.permission_module) return true;
  const perm = permissions.find((p) => p.module === item.permission_module);
  return perm ? perm.can_view : true;
}

// ─── SidebarItem ──────────────────────────────────────────────────────────────
function SidebarItem({
  item,
  permissions,
  depth = 0,
  isCollapsed,
  onExpand,
}: {
  item: MenuItem;
  permissions: Permission[];
  depth?: number;
  isCollapsed: boolean;
  onExpand: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const hasChildren = !!(item.children && item.children.length > 0);
  const Icon = ICON_MAP[item.id] || Settings;

  const isActive =
    item.path
      ? pathname === item.path || pathname.startsWith(item.path + "/")
      : false;
  const hasActiveChild = item.children?.some((c) =>
    c.path ? pathname === c.path || pathname.startsWith(c.path + "/") : false
  );

  useEffect(() => {
    if (hasActiveChild) setExpanded(true);
  }, [hasActiveChild]);

  if (!isMenuVisible(item, permissions)) return null;

  // ── COLLAPSED mode (icon only, depth=0 only shown) ──────────────────────────
  if (isCollapsed) {
    if (depth > 0) return null; // hide child items entirely when collapsed

    const iconEl = (
      <div
        className={cn(
          "flex items-center justify-center w-10 h-10 rounded-xl mx-auto transition-all duration-150",
          (isActive || hasActiveChild)
            ? "bg-[#3498db] text-white shadow-lg shadow-blue-900/30"
            : "text-white/70 hover:bg-white/15 hover:text-white"
        )}
      >
        <Icon className="w-[20px] h-[20px]" />
      </div>
    );

    return (
      <Tooltip>
        <TooltipTrigger
          id={hasChildren ? `sidebar-icon-${item.id}` : `sidebar-icon-link-${item.id}`}
          onClick={hasChildren ? onExpand : () => router.push(item.path || "#")}
          className="w-full py-1 flex justify-center cursor-pointer"
          aria-label={item.label}
        >
          {iconEl}
        </TooltipTrigger>
        <TooltipContent side="right" className="text-xs font-medium">
          {item.label}
          {/* {hasChildren && <span className="ml-1 text-slate-400">(click to expand)</span>} */}
        </TooltipContent>
      </Tooltip>
    );
  }

  // ── EXPANDED mode ────────────────────────────────────────────────────────────
  if (hasChildren) {
    const visibleChildren = item.children!.filter((c) =>
      isMenuVisible(c, permissions)
    );
    if (visibleChildren.length === 0) return null;

    return (
      <div>
        <button
          id={`sidebar-menu-${item.id}`}
          onClick={() => setExpanded((v) => !v)}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium rounded-lg transition-all duration-150",
            "text-white/80 hover:bg-white/10 hover:text-white",
            (expanded || hasActiveChild) && "bg-white/10 text-white"
          )}
        >
          {depth === 0 && <Icon className="w-[18px] h-[18px] flex-shrink-0" />}
          {depth > 0 && <span className="w-[18px]" />}
          <span className="flex-1 text-left whitespace-nowrap overflow-hidden text-ellipsis">{item.label}</span>
          {expanded ? (
            <ChevronDown className="w-3.5 h-3.5 opacity-60 flex-shrink-0" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 opacity-60 flex-shrink-0" />
          )}
        </button>

        <div
          className={cn(
            "overflow-hidden transition-all duration-200",
            expanded ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <div className="ml-5 border-l border-white/10 pl-2 py-0.5 space-y-0.5">
            {visibleChildren.map((child) => (
              <SidebarItem
                key={child.id}
                item={child}
                permissions={permissions}
                depth={depth + 1}
                isCollapsed={false}
                onExpand={onExpand}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Link
      id={`sidebar-link-${item.id}`}
      href={item.path || "#"}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 text-[13px] rounded-lg transition-all duration-150",
        depth === 0 ? "font-medium" : "font-normal text-white/70",
        isActive
          ? "bg-[#3498db] text-white shadow-md shadow-blue-900/30"
          : "text-white/80 hover:bg-white/10 hover:text-white"
      )}
    >
      {depth === 0 && <Icon className="w-[18px] h-[18px] flex-shrink-0" />}
      {depth > 0 && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full flex-shrink-0 ml-0.5",
            isActive ? "bg-white" : "bg-white/40"
          )}
        />
      )}
      <span className="whitespace-nowrap overflow-hidden text-ellipsis">{item.label}</span>
    </Link>
  );
}

// ─── Main Sidebar ─────────────────────────────────────────────────────────────
export default function Sidebar({ isOpen, onClose, onExpand }: SidebarProps) {
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>(DEFAULT_MENU);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const storedUser = getStoredUser();
    const storedPerms = getStoredPermissions();
    const storedMenu = getStoredMenu();
    if (storedUser) setUser(storedUser);
    if (storedPerms?.length) setPermissions(storedPerms);
    if (storedMenu?.length) setMenu(storedMenu);
  }, []);

  const isDesktop = !isMobile;
  // Desktop: isOpen=true → expanded(256px), isOpen=false → icon-only(64px)
  const isCollapsed = isDesktop && !isOpen;
  const currentWidth = isMobile
    ? SIDEBAR_EXPANDED_W
    : isOpen
      ? SIDEBAR_EXPANDED_W
      : SIDEBAR_COLLAPSED_W;

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        id="sidebar"
        aria-label="Main navigation"
        style={{ width: currentWidth }}
        className={cn(
          "flex-shrink-0 h-full flex flex-col bg-[#2c3e50] text-white overflow-hidden",
          // Desktop: in flex flow, animate width
          isDesktop && "relative transition-[width] duration-300 ease-in-out",
          // Mobile: fixed drawer, animate transform
          !isDesktop && "fixed top-0 left-0 z-30 transition-transform duration-300 ease-in-out",
          !isDesktop && (isOpen ? "translate-x-0" : "-translate-x-full")
        )}
      >
        {/* Inner container — width is 100% of currentWidth */}
        <div className="flex flex-col h-full w-full overflow-hidden">
          {/* ── User section ── */}
          <div
            className={cn(
              "flex flex-col items-center border-b border-white/10 transition-all duration-300",
              isCollapsed ? "py-4 px-1" : "pt-5 pb-4 px-4"
            )}
          >
            <div className="relative">
              <Avatar
                className={cn(
                  "ring-2 ring-white/30 ring-offset-2 ring-offset-[#2c3e50] transition-all duration-300",
                  isCollapsed ? "w-10 h-10" : "w-14 h-14"
                )}
              >
                <AvatarFallback
                  className={cn(
                    "bg-[#3498db] text-white font-bold",
                    isCollapsed ? "text-sm" : "text-lg"
                  )}
                >
                  {user ? getInitials(user.name) : "A"}
                </AvatarFallback>
              </Avatar>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-[#2c3e50]" />
            </div>

            {/* Text hidden when collapsed */}
            <div
              className={cn(
                "overflow-hidden transition-all duration-300 text-center w-full",
                isCollapsed ? "max-h-0 opacity-0 mt-0" : "max-h-24 opacity-100 mt-2"
              )}
            >
              <p className="text-white/50 text-[11px] tracking-wide whitespace-nowrap">Welcome,</p>
              <p className="text-white font-semibold text-sm truncate px-1">
                {user?.name || "Admin"}
              </p>
              <span className="mt-1 inline-block text-[10px] bg-[#3498db]/30 text-[#7fc8f8] px-2.5 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap">
                {user?.role || "Admin"}
              </span>
            </div>
          </div>

          {/* Mobile close button */}
          {isMobile && (
            <button
              id="sidebar-close"
              onClick={onClose}
              className="absolute top-3 right-3 text-white/60 hover:text-white transition-colors p-1"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {/* ── Navigation ── */}
          <nav
            className={cn(
              "flex-1 overflow-y-auto py-3 space-y-1 overflow-x-hidden",
              isCollapsed ? "px-2" : "px-2"
            )}
          >
            {menu.map((item) => (
              <SidebarItem
                key={item.id}
                item={item}
                permissions={permissions}
                isCollapsed={isCollapsed}
                onExpand={onExpand}
              />
            ))}
          </nav>

          {/* ── Footer ── */}
          <div
            className={cn(
              "border-t border-white/10 transition-all duration-300 overflow-hidden",
              isCollapsed ? "py-3 flex justify-center" : "py-3 px-4 text-center"
            )}
          >
            {isCollapsed ? (
              /* Collapse toggle hint icon */
              <Tooltip>
                <TooltipTrigger
                  onClick={onExpand}
                  className="text-white/30 hover:text-white/70 transition-colors p-1 cursor-pointer"
                  aria-label="Expand sidebar"
                >
                  <PanelLeftClose className="w-4 h-4 rotate-180" />
                </TooltipTrigger>
                <TooltipContent side="right" className="text-xs">
                  Expand sidebar
                </TooltipContent>
              </Tooltip>
            ) : (
              <p className="text-white/25 text-[10px] whitespace-nowrap">
                © {new Date().getFullYear()} Bajrang Parcel Service
              </p>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
