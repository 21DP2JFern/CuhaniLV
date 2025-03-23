'use client'
import { usePathname } from 'next/navigation';

export default function Header() {
    const pathname = usePathname();

    return (
        <div className="w-[100%] h-[8%] flex flex-row">
            <div className="flex flex-row w-[33%] h-[100%]">
                <a href="/profile" className={`text-main-red text-2xl mt-7 ml-10 font-light transition-all duration-300 hover:text-main-white relative group pb-1 ${pathname === '/profile' ? 'text-main-white' : ''}`}>
                    Profile
                    <span className={`absolute bottom-6 left-0 h-0.5 bg-main-white transition-all duration-300 ${pathname === '/profile' ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                </a>
            </div>
            <div className="flex flex-row justify-center">
                <a href="/forums" className={`text-main-red text-2xl mt-7 mx-4 font-light transition-all duration-300 hover:text-main-white relative group pb-1 ${pathname === '/forums' ? 'text-main-white' : ''}`}>
                    Forums
                    <span className={`absolute bottom-6 left-0 h-0.5 bg-main-white transition-all duration-300 ${pathname === '/forums' ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                </a>
                <a className={`text-main-red text-2xl mt-7 mx-4 font-light transition-all duration-300 hover:text-main-white relative group pb-1 ${pathname === '/news' ? 'text-main-white' : ''}`}>
                    News
                    <span className={`absolute bottom-6 left-0 h-0.5 bg-main-white transition-all duration-300 ${pathname === '/news' ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                </a>
                <a href="/home" className={`text-main-red text-center text-5xl mt-5 mx-12 ${pathname === '/home' ? 'text-main-white' : ''}`}>Cuhani</a>
                <a className={`text-main-red text-2xl mt-7 mx-4 font-light transition-all duration-300 hover:text-main-white relative group pb-1 ${pathname === '/teammates' ? 'text-main-white' : ''}`}>
                    Teammates
                    <span className={`absolute bottom-6 left-0 h-0.5 bg-main-white transition-all duration-300 ${pathname === '/teammates' ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                </a>
                <a className={`text-main-red text-2xl mt-7 mx-4 font-light transition-all duration-300 hover:text-main-white relative group pb-1 ${pathname === '/messages' ? 'text-main-white' : ''}`}>
                    Messages
                    <span className={`absolute bottom-6 left-0 h-0.5 bg-main-white transition-all duration-300 ${pathname === '/messages' ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                </a>
            </div>
        </div>
    );
} 