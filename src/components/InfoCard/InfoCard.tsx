import React from "react"
import Typography from "../Typography/Typography"
import Chip from "../ui/chip"
import { Button } from "../ui/button"

interface InfoCardProps {
  icon: React.ReactNode
  iconLabel: string
  title: string
  subtitle: string
  chips: string[]
  buttonLabel: string
  onClick: () => void
}

const InfoCard: React.FC<InfoCardProps> = ({
  icon,
  iconLabel,
  title,
  subtitle,
  chips,
  buttonLabel,
  onClick,
}) => {
  return (
    <div className="border border-secondary-orange p-2 max-w-[410px] max-h-[294px] rounded-4xl bg-secondary-orange/20">
      <div className="p-8 rounded-4xl w-[390px] bg-background-primary h-[238px]">
        {/* Icon + Label */}
        <div className="flex justify-start items-center gap-2">
          {icon}
          <Typography
            variant="caption"
            className="uppercase font-medium opacity-100 text-white tracking-[2px]"
          >
            {iconLabel}
          </Typography>
        </div>

        {/* Title & Subtitle */}
        <div className="flex flex-col gap-1 my-6">
          <Typography variant="h5" className="text-left">
            {title}
          </Typography>
          <Typography variant="body" className="text-[16px] text-left">
            {subtitle}
          </Typography>
        </div>

        {/* Chips */}
        <div className="flex flex-wrap justify-start items-center gap-2">
          {chips.map((chip, index) => (
            <Chip key={index} label={chip} variant="faded" size="sm" />
          ))}
        </div>
      </div>

      {/* Button */}
      <Button
        className="w-full uppercase tracking-wider font-normal bg-transparent hover:bg-transparent text-primary-orange"
        size="lg"
        onClick={onClick}
      >
        {buttonLabel}
        <p className="font-bold ml-2">→</p>
      </Button>
    </div>
  )
}

export default InfoCard
