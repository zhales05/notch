"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  AlignJustify,
  Grid2x2,
  CircleDot,
  TrendingUp,
  Gauge,
  Settings2,
  Sparkles,
} from "lucide-react";
import { useProfile } from "@/hooks/use-profile";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { SignOutButton } from "@/components/auth/sign-out-button";

const navItems = [
  { title: "Today", href: "/today", icon: LayoutGrid },
  { title: "Habits", href: "/habits", icon: AlignJustify },
  { title: "Categories", href: "/categories", icon: Grid2x2 },
  { title: "Goals", href: "/goals", icon: CircleDot },
  { title: "Measures", href: "/measures", icon: Gauge },
  { title: "Analytics", href: "/analytics", icon: TrendingUp },
  { title: "Settings", href: "/settings", icon: Settings2 },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const { profile } = useProfile();
  const isPremium = profile?.plan === "premium";

  return (
    <Sidebar>
      <SidebarHeader className="px-4 py-4">
        <div className="flex items-center gap-2.5">
          <svg
            width="28"
            height="28"
            viewBox="0 0 200 200"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <line x1="56" y1="44" x2="56" y2="156" stroke="currentColor" strokeWidth="14" strokeLinecap="round" />
            <line x1="78" y1="58" x2="78" y2="156" stroke="currentColor" strokeWidth="14" strokeLinecap="round" />
            <line x1="100" y1="86" x2="100" y2="156" stroke="currentColor" strokeWidth="14" strokeLinecap="round" />
            <line x1="122" y1="58" x2="122" y2="156" stroke="currentColor" strokeWidth="14" strokeLinecap="round" />
            <line x1="144" y1="44" x2="144" y2="156" className="text-primary" stroke="currentColor" strokeWidth="14" strokeLinecap="round" />
          </svg>
          <span className="text-lg font-semibold tracking-tight">notch</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={pathname === item.href}
                    tooltip={item.title}
                    render={
                      <Link
                        href={item.href}
                        onClick={() => setOpenMobile(false)}
                      />
                    }
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="px-2 pb-4">
        <div className="mb-2 px-2">
          {isPremium ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
              <Sparkles className="size-3" />
              Pro
            </span>
          ) : (
            <span className="inline-flex rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              Free
            </span>
          )}
        </div>
        <SignOutButton />
      </SidebarFooter>
    </Sidebar>
  );
}
