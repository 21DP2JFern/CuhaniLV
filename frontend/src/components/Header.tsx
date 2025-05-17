'use client'
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import axiosInstance from '@/services/auth';
import Cookies from 'js-cookie';

export default function Header() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [username, setUsername] = useState('');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const token = Cookies.get('auth_token');
        if (token) {
            setIsLoggedIn(true);
            // Fetch username
            axiosInstance.get('/profile')
                .then(response => {
                    setUsername(response.data.user.username);
                })
                .catch(error => {
                    console.error('Error fetching profile:', error);
                    if (error.response?.status === 401) {
                        Cookies.remove('auth_token');
                        setIsLoggedIn(false);
                    }
                });
        }

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

    const handleLogout = async () => {
        try {
            await axiosInstance.post('/logout');
            Cookies.remove('auth_token');
            setIsLoggedIn(false);
            router.push('/');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    return (
        <header className={`w-full flex flex-row fixed top-0 left-0 bg-gray-800 z-50 transition-all duration-300 ${
            isScrolled ? 'h-[6%]' : 'h-[8%] md:h-[8%] h-[10%]'
        }`}>
            {/* Mobile Menu Button */}
            <button
                onClick={toggleMobileMenu}
                className="md:hidden text-main-red hover:text-main-white transition-colors ml-4"
                aria-label="Toggle mobile menu"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={`${isScrolled ? 'w-6 h-6' : 'w-7 h-7'}`}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
            </button>

            {/* Desktop Navigation */}
            <div className="hidden md:flex flex-row w-[33%] h-[100%] items-center">
                <Link href="/profile" className={`text-main-red ml-10 font-light transition-all duration-300 hover:text-main-white relative group ${pathname === '/profile' ? 'text-main-white' : ''} ${
                    isScrolled ? 'text-xl' : 'text-2xl'
                }`}>
                    Profile
                    <span className={`absolute -bottom-1 left-0 h-0.5 bg-main-white transition-all duration-300 ${pathname === '/profile' ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                </Link>
            </div>

            {/* Center Logo and Navigation */}
            <div className="flex flex-row justify-center items-center w-[34%]">
                <Link href="/forums" className={`hidden md:block text-main-red mx-4 font-light transition-all duration-300 hover:text-main-white relative group ${pathname.includes('/forums') ? 'text-main-white' : ''} ${
                    isScrolled ? 'text-xl' : 'text-2xl'
                }`}>
                    Forums
                    <span className={`absolute -bottom-1 left-0 h-0.5 bg-main-white transition-all duration-300 ${pathname.includes('/forums') ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                </Link>
                <Link href="/news" className={`hidden md:block text-main-red mx-4 font-light transition-all duration-300 hover:text-main-white relative group ${pathname === '/news' ? 'text-main-white' : ''} ${
                    isScrolled ? 'text-xl' : 'text-2xl'
                }`}>
                    News
                    <span className={`absolute -bottom-1 left-0 h-0.5 bg-main-white transition-all duration-300 ${pathname === '/news' ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                </Link>
                <Link href="/home" className={`text-main-red text-center transition-all duration-300 mx-12 ${pathname === '/home' ? 'text-main-white' : ''} ${
                    isScrolled ? 'text-4xl' : 'text-5xl md:text-5xl text-3xl'
                } absolute left-[40%] transform -translate-x-1/2 md:static md:transform-none`}>Cuhani</Link>
                <Link href="/teammates" className={`hidden md:block text-main-red mx-4 font-light transition-all duration-300 hover:text-main-white relative group ${pathname === '/teammates' ? 'text-main-white' : ''} ${
                    isScrolled ? 'text-xl' : 'text-2xl'
                }`}>
                    Teammates
                    <span className={`absolute -bottom-1 left-0 h-0.5 bg-main-white transition-all duration-300 ${pathname === '/teammates' ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                </Link>
                {isLoggedIn && (
                    <Link href="/messages" className={`hidden md:block text-main-red mx-4 font-light transition-all duration-300 hover:text-main-white relative group ${pathname === '/messages' ? 'text-main-white' : ''} ${
                    isScrolled ? 'text-xl' : 'text-2xl'
                }`}>
                    Messages
                    <span className={`absolute -bottom-1 left-0 h-0.5 bg-main-white transition-all duration-300 ${pathname === '/messages' ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                    </Link>
                )}
            </div>

            {/* Right Side Navigation */}
            <div className="hidden md:flex flex-row justify-end items-center w-[33%] pr-10">
                {isLoggedIn ? (
                    <button
                        onClick={handleLogout}
                        className={`text-main-red font-light transition-all duration-300 hover:text-main-white relative group ${
                            isScrolled ? 'text-xl' : 'text-2xl'
                        }`}
                    >
                        Logout
                        <span className="absolute -bottom-1 left-0 h-0.5 bg-main-white transition-all duration-300 w-0 group-hover:w-full"></span>
                    </button>
                ) : (
                    <>
                        <Link href="/login" className={`text-main-red font-light transition-all duration-300 hover:text-main-white relative group mr-6 ${pathname === '/login' ? 'text-main-white' : ''} ${
                            isScrolled ? 'text-xl' : 'text-2xl'
                        }`}>
                            Login
                            <span className={`absolute -bottom-1 left-0 h-0.5 bg-main-white transition-all duration-300 ${pathname === '/login' ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                        </Link>
                        <Link href="/register" className={`text-main-red font-light transition-all duration-300 hover:text-main-white relative group ${pathname === '/register' ? 'text-main-white' : ''} ${
                            isScrolled ? 'text-xl' : 'text-2xl'
                        }`}>
                            Register
                            <span className={`absolute -bottom-1 left-0 h-0.5 bg-main-white transition-all duration-300 ${pathname === '/register' ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                        </Link>
                    </>
                )}
            </div>

            {/* Mobile Menu */}
            <div className={`md:hidden fixed inset-0 bg-gray-800 z-50 transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex flex-col h-full">
                    <div className="flex justify-between items-center p-4 border-b border-gray-700">
                        <Link href="/home" className={`text-main-red font-light transition-all duration-300 ${isScrolled ? 'text-4xl' : 'text-5xl'}`} onClick={() => setIsMobileMenuOpen(false)}>
                            Cuhani
                        </Link>
                        <button
                            onClick={toggleMobileMenu}
                            className="text-main-red hover:text-main-white transition-colors"
                            aria-label="Close mobile menu"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <nav className="flex flex-col p-4 space-y-4">
                        <Link
                            href="/forums"
                            className={`text-main-red font-light transition-all duration-300 hover:text-main-white relative group py-2 ${pathname.includes('/forums') ? 'text-main-white' : ''} ${
                                isScrolled ? 'text-xl' : 'text-2xl'
                            }`}
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Forums
                            <span className={`absolute -bottom-1 left-0 h-0.5 bg-main-white transition-all duration-300 ${pathname.includes('/forums') ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                        </Link>
                        <Link
                            href="/news"
                            className={`text-main-red font-light transition-all duration-300 hover:text-main-white relative group py-2 ${pathname === '/news' ? 'text-main-white' : ''} ${
                                isScrolled ? 'text-xl' : 'text-2xl'
                            }`}
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            News
                            <span className={`absolute -bottom-1 left-0 h-0.5 bg-main-white transition-all duration-300 ${pathname === '/news' ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                        </Link>
                        <Link
                            href="/teammates"
                            className={`text-main-red font-light transition-all duration-300 hover:text-main-white relative group py-2 ${pathname === '/teammates' ? 'text-main-white' : ''} ${
                                isScrolled ? 'text-xl' : 'text-2xl'
                            }`}
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Teammates
                            <span className={`absolute -bottom-1 left-0 h-0.5 bg-main-white transition-all duration-300 ${pathname === '/teammates' ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                        </Link>
                        {isLoggedIn ? (
                            <>
                                <Link
                                    href="/messages"
                                    className={`text-main-red font-light transition-all duration-300 hover:text-main-white relative group py-2 ${pathname === '/messages' ? 'text-main-white' : ''} ${
                                        isScrolled ? 'text-xl' : 'text-2xl'
                                    }`}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Messages
                                    <span className={`absolute -bottom-1 left-0 h-0.5 bg-main-white transition-all duration-300 ${pathname === '/messages' ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                                </Link>
                                <Link
                                    href="/profile"
                                    className={`text-main-red font-light transition-all duration-300 hover:text-main-white relative group py-2 ${pathname === '/profile' ? 'text-main-white' : ''} ${
                                        isScrolled ? 'text-xl' : 'text-2xl'
                                    }`}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Profile
                                    <span className={`absolute -bottom-1 left-0 h-0.5 bg-main-white transition-all duration-300 ${pathname === '/profile' ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                                </Link>
                                <button
                                    onClick={() => {
                                        handleLogout();
                                        setIsMobileMenuOpen(false);
                                    }}
                                    className={`text-main-red font-light transition-all duration-300 hover:text-main-white relative group py-2 text-left ${
                                        isScrolled ? 'text-xl' : 'text-2xl'
                                    }`}
                                >
                                    Logout
                                    <span className="absolute -bottom-1 left-0 h-0.5 bg-main-white transition-all duration-300 w-0 group-hover:w-full"></span>
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    href="/login"
                                    className={`text-main-red font-light transition-all duration-300 hover:text-main-white relative group py-2 ${pathname === '/login' ? 'text-main-white' : ''} ${
                                        isScrolled ? 'text-xl' : 'text-2xl'
                                    }`}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Login
                                    <span className={`absolute -bottom-1 left-0 h-0.5 bg-main-white transition-all duration-300 ${pathname === '/login' ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                                </Link>
                                <Link
                                    href="/register"
                                    className={`text-main-red font-light transition-all duration-300 hover:text-main-white relative group py-2 ${pathname === '/register' ? 'text-main-white' : ''} ${
                                        isScrolled ? 'text-xl' : 'text-2xl'
                                    }`}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Register
                                    <span className={`absolute -bottom-1 left-0 h-0.5 bg-main-white transition-all duration-300 ${pathname === '/register' ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                                </Link>
                            </>
                        )}
                    </nav>
            </div>
        </div>
        </header>
    );
} 