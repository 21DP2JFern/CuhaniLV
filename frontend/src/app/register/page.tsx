'use client'; //kautkas

import React, { useState } from 'react';
import { register } from '@/services/auth';
import { useRouter } from 'next/navigation';
import ErrorMessage from '@/components/ErrorMessage';

export default function Register() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Password length check
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      setLoading(false);
      return;
    }

    // Password match check
    if (password !== confirmPassword) {
      setError('Passwords do not match!');
      setLoading(false);
      return;
    }

    try {
      const response = await register({
        email,
        username,
        password,
        password_confirmation: confirmPassword,
      });

      console.log('Registration successful:', response);
      router.push('/');
    } catch (error: any) {
      console.error('Registration failed:', error);
      if (error.response?.data?.errors) {
        // Handle validation errors
        const errors = error.response.data.errors;
        const errorMessages = Object.values(errors).flat();
        setError(errorMessages.join(', '));
      } else {
        setError(error.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row w-full h-full">
      <div className="flex flex-col bg-main-gray w-full md:w-[70%] h-[100%]">
        <div className="flex flex-col w-[90%] md:w-[75%] mx-auto h-[60%] mt-20 md:mt-36">
          <h1 className="text-main-red font-bold text-[50px] md:text-[100px]">Welcome to Cuhani! </h1>
          <h2 className="text-main-red font-bold text-[30px] md:text-[50px]">Your Ultimate Social Hub for Gamers</h2>
          <p className="text-main-white font-semibold text-[20px] md:text-[30px] w-full md:w-[80%] mt-4">Connect with fellow gamers, join discussions in our forums, and stay up-to-date with the latest in gaming news. Whether you're looking to chat, team up, or stay informed, Cuhani brings the gaming community together in one place. </p>
          <p className="text-main-white font-semibold text-[20px] md:text-[30px] w-full md:w-[80%]">Level up your social gaming experience with us!</p>
        </div>
        <div className="flex flex-row mt-20 md:mt-52 bottom-0 h-[7%]">
          <div className="flex w-full"><p className="text-main-white mt-4 ml-6">© 2024 Cuhani</p></div>
          <div className="flex w-full"></div>
          <div className="flex w-full flex-row justify-items-center align-middle"> 
            <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="50" height="50" fill="#fdfdec" viewBox="0 0 24 24" className="ml-16 md:ml-64">
              <path d="M 8 3 C 5.243 3 3 5.243 3 8 L 3 16 C 3 18.757 5.243 21 8 21 L 16 21 C 18.757 21 21 18.757 21 16 L 21 8 C 21 5.243 18.757 3 16 3 L 8 3 z M 8 5 L 16 5 C 17.654 5 19 6.346 19 8 L 19 16 C 19 17.654 17.654 19 16 19 L 8 19 C 6.346 19 5 17.654 5 16 L 5 8 C 5 6.346 6.346 5 8 5 z M 17 6 A 1 1 0 0 0 16 7 A 1 1 0 0 0 17 8 A 1 1 0 0 0 18 7 A 1 1 0 0 0 17 6 z M 12 7 C 9.243 7 7 9.243 7 12 C 7 14.757 9.243 17 12 17 C 14.757 17 17 14.757 17 12 C 17 9.243 14.757 7 12 7 z M 12 9 C 13.654 9 15 10.346 15 12 C 15 13.654 13.654 15 12 15 C 10.346 15 9 13.654 9 12 C 9 10.346 10.346 9 12 9 z"></path>
            </svg>
            <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="" width="50" height="50" viewBox="0,0,300,270" className="ml-1">
              <g fill="#fdfdec" fillRule="nonzero" stroke="none" strokeWidth="1" strokeLinecap="butt" strokeLinejoin="miter" strokeMiterlimit="10" strokeDasharray="" strokeDashoffset="0"><g transform="scale(5.12,5.12)"><path d="M25,3c-12.15,0 -22,9.85 -22,22c0,11.03 8.125,20.137 18.712,21.728v-15.897h-5.443v-5.783h5.443v-3.848c0,-6.371 3.104,-9.168 8.399,-9.168c2.536,0 3.877,0.188 4.512,0.274v5.048h-3.612c-2.248,0 -3.033,2.131 -3.033,4.533v3.161h6.588l-0.894,5.783h-5.694v15.944c10.738,-1.457 19.022,-10.638 19.022,-21.775c0,-12.15 -9.85,-22 -22,-22z"></path></g></g>
            </svg>
            <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="50" height="50" viewBox="0,0,300,270">
              <g fill="#fdfdec" fillRule="nonzero" stroke="none" strokeWidth="1" strokeLinecap="butt" strokeLinejoin="miter" strokeMiterlimit="10" strokeDasharray="" strokeDashoffset="0"><g transform="scale(5.12,5.12)"><path d="M11,4c-3.85433,0 -7,3.14567 -7,7v28c0,3.85433 3.14567,7 7,7h28c3.85433,0 7,-3.14567 7,-7v-28c0,-3.85433 -3.14567,-7 -7,-7zM11,6h28c2.77367,0 5,2.22633 5,5v28c0,2.77367 -2.22633,5 -5,5h-28c-2.77367,0 -5,-2.22633 -5,-5v-28c0,-2.77367 2.22633,-5 5,-5zM13.08594,13l9.22266,13.10352l-9.30859,10.89648h2.5l7.9375,-9.29297l6.53906,9.29297h7.9375l-10.125,-14.38672l8.21094,-9.61328h-2.5l-6.83984,8.00977l-5.63672,-8.00977zM16.91406,15h3.06445l14.10742,20h-3.06445z"></path></g></g>
            </svg>
          </div>
        </div>
      </div>
      <div className="flex flex-col bg-main-white h-[100%] w-full md:w-[40%]">
        <form className="flex flex-col mt-[10%] md:mt-[37%] mx-auto h-[50%] w-[80%] md:w-[30%]" onSubmit={handleRegister} method="post">
          {error && <ErrorMessage message={error} className="mb-4" />}
          <input 
            className="h-14 bg-main-white border-main-gray text-main-gray text-lg indent-2 border-solid border-2 rounded-md focus:border-main-red outline-none focus:border-4" 
            type="email" 
            id="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input 
            className="h-14 mt-2 bg-main-white border-main-gray text-main-gray text-lg indent-2 border-solid border-2 rounded-md focus:border-main-red outline-none focus:border-4"
            type="text" 
            id="username"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input 
            className="h-14 mt-2 bg-main-white border-main-gray text-main-gray text-lg indent-2 border-solid border-2 rounded-md focus:border-main-red outline-none focus:border-4"
            type="password"
            id="password" 
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <input 
            className="h-14 mt-2 bg-main-white border-main-gray text-main-gray text-lg indent-2 border-solid border-2 rounded-md focus:border-main-red outline-none focus:border-4" 
            type="password"
            id="repeat-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repeat password"
            required
          />
          <button 
            className="bg-main-red text-main-white h-14 rounded-md mb-1 font-bold text-xl mt-4 disabled:opacity-50"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
          <div className="flex flex-row">
            <div className="h-0.5 w-[40%] my-7 ml-1 mr-2 bg-main-gray"></div>
            <p className="mt-2 text-center leading-5">Already have an account?</p>
            <div className="h-0.5 w-[40%] my-7 ml-2 bg-main-gray"></div>
          </div>
          <button className="bg-main-gray text-main-white h-14 mt-1 rounded-md font-bold text-xl"
          onClick={()=>{router.push("/")}}>Log in</button>
        </form>
      </div>
    </div>
  );
}
