import { useState } from "react";
import { CreditCard, Heart, Home, MessageCircleCode } from "lucide-react";


const navs = [
    {
      id:'home', 
      icon:Home
    }, 
    {
      id:'chat', 
      icon:MessageCircleCode
    }, 
    {
      id:'favourite', 
      icon:Heart
    }, 
    {
      id:'cards', 
      icon:CreditCard
    }
  ]
  
  const BottomBar = () => {
    const [selected, setSelected] = useState('chat')
    
    return (
      <div className="bg-black p-4 flex justify-between">
        {
          navs?.map(ele => (
            <button key={ele?.id} className={`h-16 w-16 ${selected === ele?.id?'bg-secondary-orange':'bg-background-primary'}  rounded-full flex justify-center items-center`}
            onClick={() => setSelected(ele?.id)}>
            <ele.icon color="#fff" />
          </button>
          ))
        }
      </div>
    );
  };

  export default BottomBar