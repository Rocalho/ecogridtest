import { Bell, Settings } from "lucide-react";

export default function Navbar() {
    return (
        <nav className="w-full md:w-[calc(100%-10.375rem)] bg-white justify-end items-center flex gap-2 p-4 text-blue-700 border-b border-gray-100 fixed ">
            <button className="bg-blue-50 p-1 rounded-lg hover:bg-blue-200 transition">
                <Settings size={16} />
            </button>
            <button className="bg-blue-50 p-1 rounded-lg hover:bg-blue-200 transition">
                <Bell size={16} />
            </button>
        </nav>
    )
}