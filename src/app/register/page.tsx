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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Home() {
  const router = useRouter();

  const [fullName, setFullName] = useState<string>("")
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [userIdNum, setUserIdNum] = useState<string>("");
  const [licenseNum, setLicenseNum] = useState<string>("");
  const [firstName, setFirstName] = useState<string>("");
  const [middleName, setMiddleName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) return;

    try {
      const authSignup = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          userIdNum,
          licenseNum,
          firstName,
          middleName,
          lastName,
        }),
      });

      if (!authSignup.ok) throw new Error("Signup failed");

      const data = await authSignup.json();
      console.log("Success:", data);

      router.push("/");
    } catch (err: any) {
      console.error(err.message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 bg-[#E6F3ED]">
      <Card className="w-full max-w-md bg-white shadow-md">
        <CardHeader>
          <CardTitle className="text-[#135A39] text-2xl font-bold">Create Account</CardTitle>
          <CardDescription className="text-[#135A39]">Register to access the laboratory system</CardDescription>
          <Separator />
        </CardHeader>

        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="flex gap-3">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="userIdNum" className="text-[#111827] placeholder:text-[#9CA3AF]">DOH ID No.</Label>
                <Input
                  id="userIdNum"
                  type="text"
                  placeholder="ID-123"
                  className="text-[#111827] placeholder:text-[#9CA3AF] selection:bg-[#135A39] selection:text-white"
                  value={userIdNum}
                  onChange={(e) => setUserIdNum(e.target.value)}
                />
              </div>

              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="licenseNum" className="text-[#111827] placeholder:text-[#9CA3AF]">PRC License No.</Label>
                <Input
                  id="licenseNum"
                  type="text"
                  placeholder="LIC-123"
                  className="text-[#111827] placeholder:text-[#9CA3AF] selection:bg-[#135A39] selection:text-white"
                  value={licenseNum}
                  onChange={(e) => setLicenseNum(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="lastName" className="text-[#111827] placeholder:text-[#9CA3AF]">Last Name</Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Uy"
                  className="text-[#111827] placeholder:text-[#9CA3AF] selection:bg-[#135A39] selection:text-white"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>

              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="firstName" className="text-[#111827] placeholder:text-[#9CA3AF]">First Name</Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="Lysander"
                  className="text-[#111827] placeholder:text-[#9CA3AF] selection:bg-[#135A39] selection:text-white"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="middleName" className="text-[#111827] placeholder:text-[#9CA3AF] ">Middle Name</Label>
                <Input
                  id="middleName"
                  type="text"
                  placeholder="Sestoso"
                  className="text-[#111827] placeholder:text-[#9CA3AF] selection:bg-[#135A39] selection:text-white"
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="email" className="text-[#111827] placeholder:text-[#9CA3AF]">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                className="text-[#111827] placeholder:text-[#9CA3AF] selection:bg-[#135A39] selection:text-white"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="password" className="text-[#111827] placeholder:text-[#9CA3AF] ">Password</Label>
              <Input
                id="password"
                type="password"
                className="text-[#111827] placeholder:text-[#9CA3AF] selection:bg-[#135A39] selection:text-white"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-[#111827] placeholder:text-[#9CA3AF]">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                className="text-[#111827] placeholder:text-[#9CA3AF] selection:bg-[#135A39] selection:text-white"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              {(confirmPassword && confirmPassword !== password) && (
                <span className="text-red-600 text-sm mt-1">Passwords do not match</span>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-[#135A39] text-white hover:bg-[#0f4030] mt-2 hover:cursor-pointer">
              Create Account
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-[#111827]">
            Already have an account?{" "}
            <Link
              href="/"
              className="text-[#135A39] font-semibold hover:underline"
            >
              Sign in here
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

