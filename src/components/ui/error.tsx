'use client';

import { ErrorProp } from "@/types/error";


export default function Error({ error, onErrorTryAgain }: ErrorProp) {
  const getErrorMessage = () => {
    if (error?.status && error?.data?.errorCode) {
      return `Error ${error?.data?.errorCode}`;
    }
    if (error?.message) {
      return error.message;
    }
    return 'An unexpected error occurred';
  };
  return (
    <div className="relative w-full h-[200px]">
      <div className="absolute w-[100%] h-full px-10 rounded-2xl bg-destructive flex items-center justify-between gap-4">
        <div className="flex flex-col gap-4 items-start justify-start">
          <div className="w-full text-left">
            <h1 className="font-bold tracking-[5px] text-white text-xl">Error!</h1>
            <p className="-mt-[2px] text-lg text-white tracking-wider">{getErrorMessage()}</p>
          </div>
          <button className="w-[200px] h-10 bg-white rounded-lg cursor-pointer" onClick={() => {
            if(onErrorTryAgain){
              onErrorTryAgain?.()
            }else{
              window.location.reload()
            }
          }}>
            <h1 className="text-destructive/80 text-sm font-semibold uppercase">try again</h1>
          </button>
        </div>
        <div className="flex flex-col justify-center items-center w-[120px]">
          <div className="w-[60px] h-[60px] bg-white border border-gray-500 rounded-full z-[2] animate-bounce relative">
            <div className="absolute top-[40%] left-[20%] w-[5px] h-[5px] bg-gray-700 rounded-full" />
            <div className="absolute top-[40%] left-[68%] w-[5px] h-[5px] bg-gray-700 rounded-full" />
            <div className="absolute top-[43%] left-[41%] w-[7px] h-[7px] rounded-full border-2 border-transparent border-b-gray-700 border-r-gray-700 rotate-45" />
          </div>

          <div className="w-[80px] h-[8px] bg-gray-700 opacity-50 rounded-full" />
        </div>
      </div>
    </div>
  );
}
