"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import NavBar from "@/components/NavBar";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { PlusCircleIcon, SlidersHorizontalIcon, ArrowDownNarrowWide, SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { POST } from "./api/auth/signup/route";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const router = useRouter();

  const [userIdNum, setUserIdNum] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const authLogin = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userIdNum,
          password,
        }),
      });

      if (!authLogin) throw new Error("Login failed");

      const data = await authLogin.json();
      console.log("Success:", data);

      router.push("/home");
    } catch (err: any) {
      console.error(err.message);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 bg-[#E6F3ED]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-[#135A39] text-2xl font-bold">Login</CardTitle>
          <CardDescription className="text-[#135A39]">
            Sign in to access the laboratory system
          </CardDescription>
          <Separator />
        </CardHeader>

        <CardContent>
          <form className="space-y-4" onSubmit={handleLogin}>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="email" className="text-[#111827] placeholder:text-[#9CA3AF]">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                className="text-[#111827] placeholder:text-[#9CA3AF] selection:bg-[#135A39] selection:text-white"
                value={userIdNum}
                onChange={(e) => { setUserIdNum(e.target.value) }}
              />
            </div>

            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="password" className="text-[#111827] placeholder:text-[#9CA3AF]">Password</Label>
              <Input
                id="password"
                type="password"
                className="text-[#111827] placeholder:text-[#9CA3AF] selection:bg-[#135A39] selection:text-white"
                value={password}
                onChange={(e) => { setPassword(e.target.value) }}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-[#135A39] text-white hover:bg-[#0f4030] mt-2"
            >
              Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div >

  );
}

