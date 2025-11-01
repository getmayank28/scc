"use client";
import Link from 'next/link'


const Footer: React.FC = () => {
  return (
    <footer className="bg-[#010101] flex flex-col z-40 max-md:px-6 max-md:pb-12 pb-10">
      <div className="container mx-auto px-[200px] max-md:hidden">
        <div className='flex w-full pl-[200px] py-10'>
          <div className='w-[calc(100%/3)]'>
            <h3 className="text-[12px] text-[#828282] text-start">
              Learn
            </h3>
            <div className="mt-6">
              <Link href='/about'>
                <h3 className="text-[12px] text-[#fff] text-start">
                  About
                </h3>
              </Link>
            </div>
          </div>
          <div className='w-[calc(100%/3)]'>
            <h3 className="text-[12px] text-[#828282] text-start">
              Legal
            </h3>
            <div className="mt-6 flex flex-col gap-4 items-start">
              <Link href='/privacy-policy'>
                <h3 className="text-[12px] text-[#fff] text-start">
                  Privacy Policy
                </h3>
              </Link>
              <Link href='/legal-compliance'>
                <h3 className="text-[12px] text-[#fff] text-start">
                  Compilance
                </h3>
              </Link>
              <Link href='/terms'>
                <h3 className="text-[12px] text-[#fff] text-start">
                  Terms
                </h3>
              </Link>
            </div>
          </div>
          <div className='w-[calc(100%/3)]'>
            <h3 className="text-[12px] text-[#828282] text-start">
              Contact us
            </h3>
            <div className="mt-6">
              <Link href='mailto:support@gofisense.com'>
                <h3 className="text-[12px] text-[#fff] text-start">
                  support@gofisense.com
                </h3>
              </Link>
            </div>
          </div>
        </div>
        <div>
          <div className="w-full h-[1px] bg-white opacity-5 mb-7"></div>
          <h3 className="text-[12px] text-[#828282] text-center">
            © 2025 FiSense. All rights reserved.
          </h3>
        </div>
      </div>
      <div className="container hidden max-md:block">
        <div className='flex flex-col gap-6 my-6'>
        <div className='w-full text-center'>
            <h3 className="text-[12px] text-[#828282]">
              Learn
            </h3>
            <div className="mt-2">
              <Link href='/about'>
                <h3 className="text-[12px] text-[#fff]">
                  About
                </h3>
              </Link>
            </div>
          </div>
          
          <div className='w-full text-center'>
            <h3 className="text-[12px] text-[#828282]">
              Contact us
            </h3>
            <div className="mt-2">
              <Link href='mailto:support@gofisense.com'>
                <h3 className="text-[12px] text-[#fff]">
                  support@gofisense.com
                </h3>
              </Link>
            </div>
          </div>
          <div className='w-full text-center'>
            <h3 className="text-[12px] text-[#828282]">
              Legal
            </h3>
            <div className="mt-2 flex flex-col gap-2">
              <Link href='/privacy-policy'>
                <h3 className="text-[12px] text-[#fff]">
                  Privacy Policy
                </h3>
              </Link>
              <Link href='/legal-compliance'>
                <h3 className="text-[12px] text-[#fff]">
                  Compilance
                </h3>
              </Link>
              <Link href='/terms'>
                <h3 className="text-[12px] text-[#fff]">
                  Terms
                </h3>
              </Link>
            </div>
          </div>
        </div>
        <div>
          <div className="w-full h-[1px] bg-white opacity-5 mb-7"></div>
          <h3 className="text-[12px] text-[#828282] text-center">
            © 2025 FiSense. All rights reserved.
          </h3>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
