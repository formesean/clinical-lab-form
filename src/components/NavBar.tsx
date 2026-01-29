import { CircleUserRound } from "lucide-react";

export default function NavBar() {

    return (
        <div className="sticky flex justify-between items-center h-13 bg-[#E6F3ED] px-20 text-black">
            <div className="flex items-center justify-center font-bold text-4xl text-[#135A39] space-x-3">
                <img src="/logo.png" alt="" className="h-10 w-10 mt-1   " />
                <a href="/home" className="text-[#135A39] font-sans">DOH</a>
            </div>
            <div className="flex justify-between space-x-10 items-center text-[#135A39]">
                <a href="#">Home</a>
                <a href="#">Patients</a>
                <a href="#"><CircleUserRound className="size-8" /></a>
            </div>
        </div >
    );
}