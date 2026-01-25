import { CircleUserRound } from "lucide-react";

export default function NavBar() {

    return (
        <div className="sticky flex justify-between items-center h-13 bg-white px-20 text-black">
            <div className="flex items-center font-bold text-4xl">
                <a href="#">DOH</a>
            </div>
            <div className="flex justify-between space-x-10 items-center">
                <a href="#">Home</a>
                <a href="#">Patients</a>
                <a href="#"><CircleUserRound className='size-8' /></a>
            </div>
        </div >
    );
}