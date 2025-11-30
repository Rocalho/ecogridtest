import Navbar from "@/components/Navbar";
import Sidebar from "@/components/sidebar/Sidebar";
import { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
    return (
        <section className="flex bg-gray-50 min-h-dvh">
            <Sidebar />
            <div className="flex flex-col md:ml-41.5 w-full">
                <Navbar />
                <div className="p-4 mt-14">
                    {children}
                </div>
            </div>
        </section>
    )
}