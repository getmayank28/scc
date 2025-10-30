import React from 'react';
import { CreditCard } from '../CreditCard';

const LandingAnimation = () => {
    return (
        <div className="w-full max-w-7xl px-5 py-0 flex items-center justify-center mx-auto">
            {/* Card Stack Container */}
            <div className="relative w-full max-w-4xl">

                {/* Blue Card */}
                <div
                    style={{
                        transform: 'rotate(-18deg) scale(0.98)',
                        transition: 'all 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        zIndex: 10,
                    }}
                    className="absolute w-72 h-44 md:w-[340px] md:h-[214px] top-16 md:top-20 left-10 md:left-[15%] shadow-2xl cursor-pointer"
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'rotate(0deg) translateY(-32px) translateX(64px) scale(1.05)';
                        e.currentTarget.style.zIndex = '101';
                        e.currentTarget.style.boxShadow = '0 40px 100px rgba(0,0,0,0.5)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'rotate(-18deg) scale(0.98)';
                        e.currentTarget.style.zIndex = '10';
                        e.currentTarget.style.boxShadow = '0 20px 60px rgba(0,0,0,0.3)';
                    }}
                >
                    <CreditCard />
                </div>

                {/* Black Card */}
                <div
                    style={{
                        transform: 'rotate(18deg) scale(0.98)',
                        transition: 'all 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        zIndex: 5,
                    }}
                    className="absolute w-72 h-44 md:w-[340px] md:h-[214px] top-16 md:top-20 right-10 md:right-[15%] cursor-pointer"
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'rotate(0deg) translateY(-32px) translateX(-64px) scale(1.05)';
                        e.currentTarget.style.zIndex = '100';
                        e.currentTarget.style.boxShadow = '0 20px 60px rgba(0,0,0,0.5)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'rotate(18deg) scale(0.98)';
                        e.currentTarget.style.boxShadow = '0 20px 60px rgba(0,0,0,0.3)';
                    }}
                >
                    <CreditCard />
                </div>
            </div>
        </div>
    );
};

export default LandingAnimation;