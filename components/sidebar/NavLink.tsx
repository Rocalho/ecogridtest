"use client"

import { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavLinkType = {
    name: string;
    route: string;
    icon: LucideIcon;
};


export function NavLink({ name, route, icon: Icon }: NavLinkType) {
    const pathname = usePathname();
    const isActive = pathname === route;

    const baseClasses =
        "font-semibold text-sm uppercase flex gap-4 items-center p-2 rounded-lg transition hover:bg-blue-100";
    const activeClasses = "text-blue-600 bg-blue-100";
    const inactiveClasses = "text-slate-700 hover:text-blue-600";

    return (
        <Link
            href={route}
            className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
        >
            <Icon size={16} strokeWidth={2.5} />
            <p className="hidden md:flex">{name}</p>
        </Link>
    );
}