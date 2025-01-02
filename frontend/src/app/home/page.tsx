

export default function Home() {
  return (
    <div className="w-[100%] h-[8%] flex flex-row " >
        <div className="flex flex-row w-[33%] h-[100%]">
            <a href="/profile" className="text-main-red text-2xl mt-7 ml-10 font-light">profile</a>
        </div>
        <div className=" flex flex-row justify-center">
        <a className="text-main-red text-2xl mt-7 mx-4 font-light">forums</a>
        <a className="text-main-red text-2xl mt-7 mx-4 font-light">news</a>
        <a href="/home" className="text-main-red text-center text-5xl mt-5 mx-12">Cuhani</a>
        <a className="text-main-red text-2xl mt-7 mx-4 font-light">teammates</a>
        <a className="text-main-red text-2xl mt-7 mx-4 font-light">messages</a>
        </div>
        

    </div>
  );
}
