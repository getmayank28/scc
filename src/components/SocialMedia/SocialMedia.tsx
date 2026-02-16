'use client'

import React from 'react'
import { Facebook, Linkedin, Instagram } from 'lucide-react'
import Typography from '../Typography/Typography'
import Divider from '../ui/divider'

const socialLinks = [
  {
    icon: Linkedin,
    href: 'https://www.linkedin.com/company/gofisense/',
    color: 'bg-[#0077b5]',
    label: 'LinkedIn',
  },
  {
    icon: Instagram,
    href: 'https://www.instagram.com/gofisense?igsh=MWlnOHhnMWtpZTh6NQ==',
    color: 'bg-[#3b5999]',
    label: 'Facebook',
  },
  {
    icon: Facebook,
    href: 'https://www.facebook.com/share/1LJ2DZFGro/',
    color: 'bg-[#55acee]',
    label: 'Twitter',
  }
]

export default function SocialMediaIcons() {
  return (
    <div className="flex flex-col items-start gap-6">
      <div className='flex flex-col justify-start gap-3'>
        <Typography variant='caption' className='text-left opacity-80 uppercase font-bold tracking-wider'>Connect with us</Typography>
        <Typography variant='caption' className='text-left font-semibold'>Stay updated with the latest in credit card <br />rewards, financial strategies, and platform <br /> updates.</Typography>
      </div>
      <ul className="flex gap-5">
        {socialLinks.map((social, index) => {
          const Icon = social.icon
          return (
            <li key={index} className="list-none">
              <a
                href={social.href}
                aria-label={social.label}
                target='_blank'
                className="relative group transition-all duration-500 hover:border-primary-orange flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 border-white/50 bg-transparent"
              >
                <Icon className="relative z-[3] h-6 w-6  transition-all duration-500 text-[#fff] group-hover:text-primary-orange" />
              </a>
            </li>
          )
        })}
      </ul>
      <div className='mt-auto'>
        <Divider className='border-white/30 min-w-[306px]' />
        <div className='flex gap-1 mt-4'>
          <Typography variant='caption' className='text-secondary-gray text-left opacity-100 font-semibold'>Mail us at </Typography>
          <Typography variant='caption' className='text-left opacity-90 font-semibold'>support@gofisense.com</Typography>
        </div>
      </div>
    </div>
  )
}
