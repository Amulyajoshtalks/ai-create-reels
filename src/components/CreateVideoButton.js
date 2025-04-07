// components/CreateVideoButton.js

import { useRouter } from "next/navigation";


export default function CreateVideoButton() {
  const router=useRouter();

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={()=>router.push("/create")}
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg z-50 hover:bg-blue-700 transition-all"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-6 w-6" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 4v16m8-8H4" 
          />
        </svg>
      </button>

    
  
    </>
  );
}