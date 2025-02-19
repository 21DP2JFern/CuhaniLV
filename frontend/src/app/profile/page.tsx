'use client'
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

export default function Home() {
    const [profile, setProfile] = useState({username: '', email: ''});
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleLogout = async () => {
        try {
          const response = await axios.post('http://localhost:8000/api/logout', {}, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('userToken')}`,
            },
          });
    
          alert(response.data.message);
        } catch (error) {
          console.error('Error during logout:', error);
        }
      };
    


    useEffect(() => {
        
    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('userToken');
            if (token) {
                const response = await axios.get('http://127.0.0.1:8000/api/profile', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setProfile(response.data.data);

            } else {
                setError("User is not authenticated.");
            }
        } catch (err) {
            setError("Error fetching profile.");
        }
    };

    
    fetchProfile();
    }, []); 
    return (
        <div className='w-full h-full flex flex-col'>   
            <div className="w-[100%] h-[8%] flex flex-row justify-center " >
                <div className=" flex flex-row justify-center">
                    <a className="text-main-red text-2xl mt-7 mx-4 font-light">forums</a>
                    <a className="text-main-red text-2xl mt-7 mx-4 font-light">news</a>
                    <a href="/home" className="text-main-red text-center text-5xl mt-5 mx-12">Cuhani</a>
                    <a className="text-main-red text-2xl mt-7 mx-4 font-light">teammates</a>
                    <a className="text-main-red text-2xl mt-7 mx-4 font-light">messages</a>
                </div>
        
            </div>

            <div className='flex flex-col w-[50%] h-[80%] mx-auto my-10 '>
                <div className='w-full h-[25%] bg-white rounded-md flex'>
                    <div className='w-56 h-56 ml-[10%] mt-24 bg-main-gray rounded-full flex'>
                        <div className='w-52 h-52 mx-auto my-auto bg-main-white rounded-full'>

                        </div>
                    </div>

                </div>
                <button className='' onClick={handleLogout}>Logout</button>
                <div className='w-full h-[75%] bg-transparent flex'>
                    <a className="text-main-white text-2xl ml-[32%] mt-4">Username: {profile?.username ?? 'Loading...'}</a>
                </div>
                   
            </div>
        </div>
    );
  }
  