'use client'
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function Header() {
    const pathname = usePathname();
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 50) {
                setIsScrolled(true);
            } else {
                setIsScrolled(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className={`w-full flex flex-row fixed top-0 left-0 bg-gray-800 z-50 transition-all duration-300 ${
            isScrolled ? 'h-[6%]' : 'h-[8%]'
        }`}>
            <div className="flex flex-row w-[33%] h-[100%] items-center">
                <a href="/profile" className={`text-main-red ml-10 font-light transition-all duration-300 hover:text-main-white relative group ${pathname === '/profile' ? 'text-main-white' : ''} ${
                    isScrolled ? 'text-xl' : 'text-2xl'
                }`}>
                    Profile
                    <span className={`absolute -bottom-1 left-0 h-0.5 bg-main-white transition-all duration-300 ${pathname === '/profile' ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                </a>
            </div>
            <div className="flex flex-row justify-center items-center w-[34%]">
                <a href="/forums" className={`text-main-red mx-4 font-light transition-all duration-300 hover:text-main-white relative group ${pathname.includes('/forums') ? 'text-main-white' : ''} ${
                    isScrolled ? 'text-xl' : 'text-2xl'
                }`}>
                    Forums
                    <span className={`absolute -bottom-1 left-0 h-0.5 bg-main-white transition-all duration-300 ${pathname.includes('/forums') ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                </a>
                <a className={`text-main-red mx-4 font-light transition-all duration-300 hover:text-main-white relative group ${pathname === '/news' ? 'text-main-white' : ''} ${
                    isScrolled ? 'text-xl' : 'text-2xl'
                }`}>
                    News
                    <span className={`absolute -bottom-1 left-0 h-0.5 bg-main-white transition-all duration-300 ${pathname === '/news' ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                </a>
                <a href="/home" className={`text-main-red text-center transition-all duration-300 mx-12 ${pathname === '/home' ? 'text-main-white' : ''} ${
                    isScrolled ? 'text-4xl' : 'text-5xl'
                }`}>Cuhani</a>
                <a href="/teammates" className={`text-main-red mx-4 font-light transition-all duration-300 hover:text-main-white relative group ${pathname === '/teammates' ? 'text-main-white' : ''} ${
                    isScrolled ? 'text-xl' : 'text-2xl'
                }`}>
                    Teammates
                    <span className={`absolute -bottom-1 left-0 h-0.5 bg-main-white transition-all duration-300 ${pathname === '/teammates' ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                </a>
                <a href="/messages" className={`text-main-red mx-4 font-light transition-all duration-300 hover:text-main-white relative group ${pathname === '/messages' ? 'text-main-white' : ''} ${
                    isScrolled ? 'text-xl' : 'text-2xl'
                }`}>
                    Messages
                    <span className={`absolute -bottom-1 left-0 h-0.5 bg-main-white transition-all duration-300 ${pathname === '/messages' ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                </a>
            </div>
        </div>
    );
} 