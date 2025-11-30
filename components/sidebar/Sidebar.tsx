"use client";

import { ChartNetwork, ChartScatter, LayoutDashboard, Play, TrendingUp } from "lucide-react";
import { NavLink, NavLinkType } from "./NavLink";


const links: NavLinkType[] = [
    { name: "Painel", route: "/", icon: LayoutDashboard },
    { name: "Rede", route: "/network", icon: ChartNetwork },
    { name: "Análise", route: "/analytics", icon: ChartScatter },
    { name: "Predição", route: "/prediction", icon: TrendingUp },
    { name: "Simulação", route: "/simulation", icon: Play },
];

export default function Sidebar() {
    return (
        <nav className="bg-white border-r border-gray-100 h-fit md:h-dvh fixed w-full md:w-fit p-4 flex md:flex-col bottom-0 justify-center md:justify-start border-t md:border-t-0 gap-2">
            <p className="hidden md:flex text-blue-600 justify-center font-black border-b border-gray-200 pb-4 mb-4">
                ECOGRID+
            </p>
            {links.map((link) => (
                <NavLink key={link.name} {...link} />
            ))}
        </nav>
    );
}
