"use client";
import { ROUTES } from "@/libs/constants/routes";
import { HoverBorderGradient } from "../ui/hover-border-gradient";
import { useRouter } from "next/navigation";

export function ActionButton({ title }: { title: string }) {
    const router = useRouter()

    return (
        <div className="mt-8" onClick={() => router.push(ROUTES.CARD)}>
            <HoverBorderGradient
                containerClassName="rounded-full"
                as="button"
                className="bg-[#101010] py-4 px-10 cursor-pointer text-white flex items-center space-x-2"
            >
                <span>{title}</span>
                <p className="font-bold">→</p>
            </HoverBorderGradient>
        </div>
    );
}


