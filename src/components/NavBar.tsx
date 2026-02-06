"use client"

import { CircleUserRound, LogOutIcon } from "lucide-react";
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
import { clearAccessToken, getAccessToken } from "@/lib/auth-client";
import { useState, useEffect } from "react";
import type { MeResponse } from "@/types/api/auth";

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

    const [now, setNow] = useState<Date | null>(null);
    const [me, setMe] = useState<MeResponse | null>(null);

    useEffect(() => {
        setNow(new Date());
        const interval = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        let isMounted = true;

        const loadMe = async () => {
            try {
                const token = getAccessToken();
                const headers: HeadersInit = {};
                if (token) {
                    headers.Authorization = `Bearer ${token}`;
                }

                const res = await fetch("/api/me", { headers });
                if (!res.ok) throw new Error("Failed to fetch user profile");
                const data = (await res.json()) as MeResponse;
                if (isMounted) setMe(data);
            } catch (err: any) {
                console.error(err.message ?? "Failed to load profile");
                if (isMounted) setMe(null);
            }
        };

        loadMe();

        return () => {
            isMounted = false;
        };
    }, []);

    const dateStr = now
        ? now.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        })
        : "–";
    const timeStr = now
        ? now.toLocaleTimeString("en-US", {
            hour12: true,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        })
        : "–";

    const profile = me?.profile;
    const displayName = profile
        ? [profile.firstName, profile.middleName, profile.lastName].filter(Boolean).join(" ")
        : "Unknown user";
    const isAdmin = profile?.role === "ADMIN";

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
                        <p className="font-semibold text-[#111827]">{dateStr}, {timeStr}</p>
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
                                    <DropdownMenuItem className="hover:cursor-pointer">Profile</DropdownMenuItem>
                                </HoverCardTrigger>
                                <HoverCardContent side="left" align="start" className="flex w-64 flex-col gap-0.5">
                                    <div className="font-semibold text-[#111827]">{displayName}</div>
                                    <div className="text-muted-foreground text-xs">{profile?.email ?? me?.user?.email ?? "—"}</div>
                                    <div className="mt-2 text-xs text-[#111827]">ID No.: {profile?.userIdNum ?? "—"}</div>
                                    <div className="text-xs text-[#111827]">License No.: {profile?.licenseNum ?? "—"}</div>
                                    <div className="text-xs text-[#111827]">Role: {profile?.role ?? "—"}</div>
                                    <div className="text-xs text-[#111827]">Status: {profile?.status ?? "—"}</div>
                                </HoverCardContent>
                            </HoverCard>
                            {isAdmin ? (
                                <DropdownMenuItem asChild className="hover:cursor-pointer">
                                    <a href="/admin/mapper">Mapper</a>
                                </DropdownMenuItem>
                            ) : null}
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
