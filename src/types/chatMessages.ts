import { InputProps } from "@/models/Question";

export interface MessageProps {
  id: string;
  role: string;
  content: string;
  inputs: InputProps[];
}
