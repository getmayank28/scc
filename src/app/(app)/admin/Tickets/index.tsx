import Typography from "@/components/Typography/Typography"
import { useGetAllTicketsQuery } from "@/store/admin"
import dayjs from "dayjs"

interface TicketProps {
  _id:string;
  email:string;
  feedback:string;
  updatedAt:string;
  createdAt:string;
  status:string;
}
const RaisedTickets = () => {
  const {data} = useGetAllTicketsQuery({})

  return (
    <div className="flex flex-col justify-start gap-4 p-10">
      <Typography variant="h4" className="text-left">Raised Tickets</Typography>
      <div className="flex gap-4 flex-wrap">
        {
          data?.map((ele:TicketProps) => (
            <div key={ele?._id} className="bg-brown-sidebar max-w-sm min-w-xs p-2 border-2 border-brown-border">
             <div className="flex gap-2 justify-between">
              <Typography variant="caption" className="opacity-100 text-sm">{ele?.email}</Typography>
              <Typography variant="caption" className="opacity-100 text-sm font-semibold bg-primary-orange p-1 rounded-md w-fit mt-0 pt-0">{ele?.status}</Typography>
             </div>
             <div>
            <div className="flex justify-between">
              <Typography variant="caption" className="opacity-100 text-sm" >Created</Typography>
              <Typography variant="caption" className="opacity-100 text-sm">{dayjs(ele?.createdAt).format("MMM DD, YYYY")}</Typography>
             </div>
             <div className="flex justify-between">
              <Typography variant="caption" className="opacity-100 text-sm">Last Updated</Typography>
              <Typography variant="caption" className="opacity-100 text-sm">{dayjs(ele?.updatedAt).format("MMM DD, YYYY")}</Typography>
             </div>
            </div>
             <div>
              <Typography variant="caption" className="text-left opacity-100 text-sm font-semibold mt-2">User Message</Typography>
              <div className="bg-brown-background p-1">
              <Typography variant="caption" className="text-left opacity-100 text-sm">{ele?.feedback}</Typography>
                </div>
             </div>
            </div>
          ))
        }

      </div>
    </div>
  )
}


export default  RaisedTickets