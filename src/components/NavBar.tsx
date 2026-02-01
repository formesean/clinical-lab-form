"use client"

import { ChevronLeft, CircleUserRound, LogOutIcon } from "lucide-react";
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./ui/hover-card";
import { useRouter } from "next/navigation";
import { clearAccessToken } from "@/lib/auth-client";

export default function NavBar() {
    const router = useRouter();

    const handleLogout = async () => {

        try {
            const authLogout = await fetch("/api/auth/logout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            })

            if (!authLogout.ok) throw new Error("Log out failed");

            clearAccessToken();
            const data = await authLogout.json();
            console.log("Success:", data);

            router.push("/");
        } catch (err: any) {
            console.error(err.message);
        }
    };

    const Date = "Saturday, January 24, 2026"
    const Time = "11:10:32 PM"
    const bogo = '<'

    return (
        <div className="sticky flex justify-between place-items-center h-14 bg-[#E6F3ED] px-20 text-black border-b-2 border-[#B7D7C6]">
            <div className="flex items-center justify-center  text-4xl ">
                <a href="/home" className="flex text-[#135A39] font-bold space-x-3">
                    <img src="/logo.png" alt="" className="h-10 w-10" />
                    <span>DOH</span>
                </a>
            </div>
            <div className="flex justify-between space-x-5 items-center text-[#135A39]">
                <div className="flex items-center justify-center space-x-6 text-[#135A39]">
                    <div className="flex flex-col items-end text-sm">
                        <p className="text-[#6B7280]">Philippine Standard Time</p>
                        <p className="font-semibold text-[#111827]">{Date},{Time}</p>
                    </div>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <CircleUserRound className="size-9 hover:cursor-pointer" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-25">
                        <DropdownMenuGroup>
                            <DropdownMenuLabel>My Account</DropdownMenuLabel>
                            <HoverCard openDelay={10} closeDelay={100}>
                                <HoverCardTrigger asChild>
                                    <DropdownMenuItem>Profile</DropdownMenuItem>
                                </HoverCardTrigger>
                                <HoverCardContent side="left" align="start" className="flex w-64 flex-col gap-0.5">
                                    <div className="font-semibold">@nextjs</div>
                                    <div>The React Framework – created and maintained by @vercel.</div>
                                    <div className="text-muted-foreground mt-1 text-xs">
                                        Joined December 2021
                                    </div>
                                </HoverCardContent>
                            </HoverCard>
                            <DropdownMenuItem className="hover:cursor-pointer">Support</DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuGroup>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem variant="destructive" className="hover:cursor-pointer" onClick={handleLogout} >
                                <LogOutIcon />
                                Sign Out
                                <DropdownMenuShortcut />
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div >
    );
}