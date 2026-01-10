import { useState } from "react";
import { Brain, CreditCard, Home, MessagesSquare, User } from "lucide-react";


const navs = [
    {
      id:'home', 
      icon:Home
    }, 
    {
      id:'chat', 
      icon:MessagesSquare
    }, 
    {
      id:'Spend Optimizer', 
      icon:Brain
    }, 
    {
      id:'cards', 
      icon:CreditCard
    },
    {
      id:'profile', 
      icon:User
    }
  ]
  
  const BottomBar = () => {
    const [selected, setSelected] = useState('chat')
    
    return (
      <div className="bg-black shadow-2xl hidden z-[9999] p-4 max-md:flex justify-between fixed bottom-0 left-0 right-0">
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