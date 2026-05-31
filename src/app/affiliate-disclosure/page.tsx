import React from 'react';
import { Scale, Handshake, ShoppingCart, BadgeCheck, UserCheck, Mail } from 'lucide-react';
import Tagline from '@/components/LandingAnimation/Tagline/Tagline';
import { Footer } from '@/landing/Footer';
import { Header } from '@/components/Header';
import { divider } from '../../../public/images/divider';

export default function AffiliateDisclosure() {
  const sections = [
    {
      icon: <Scale className="w-6 h-6" />,
      title: "1. Our Commitment to Objectivity",
      content: "Compensation received through affiliate partnerships does not influence our recommendations, rankings, calculations, or analysis. Our recommendations are based on factors such as user spending patterns, reward structures and earning rates, fees and charges, redemption value, product features and benefits, and user-selected preferences. We strive to present information in a fair, transparent, and unbiased manner."
    },
    {
      icon: <Handshake className="w-6 h-6" />,
      title: "2. Affiliate Relationships",
      content: "FiSense may participate in affiliate, referral, advertising, and partner programs offered by banks, financial institutions, merchants, travel providers, voucher platforms, marketplaces, and other service providers. As part of these relationships, FiSense may earn compensation when users apply for a credit card or financial product, purchase products or services through partner links, book travel or accommodations through partner platforms, purchase gift cards, vouchers, or merchant offers, or complete other qualifying actions defined by the partner."
    },
    {
      icon: <ShoppingCart className="w-6 h-6" />,
      title: "3. Amazon Associate Disclosure",
      content: "FiSense may participate in the Amazon Associates Program, an affiliate advertising program designed to provide a means for websites to earn advertising fees by advertising and linking to Amazon properties. As an Amazon Associate, FiSense may earn from qualifying purchases."
    },
    {
      icon: <BadgeCheck className="w-6 h-6" />,
      title: "4. No Additional Cost to Users",
      content: "In these cases, using an affiliate link does not result in any additional cost to the user. Any compensation received helps support the development, maintenance, and improvement of the FiSense platform."
    },
    {
      icon: <UserCheck className="w-6 h-6" />,
      title: "5. Independent Decision Making",
      content: "Users should always evaluate financial products and services independently and review the official terms and conditions provided by the respective issuer, merchant, or service provider before making any financial decision."
    }
  ];

  return (
    <div className="min-h-screen bg-[#101010] text-white">
      <Header />
      <div className="max-w-4xl mx-auto px-6 py-16 pt-[150px]">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Affiliate Disclosure</h1>
          <p className="text-sm text-gray-500 mb-6">Last Updated: 1 May 2026</p>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            At FiSense, our mission is to help users make smarter financial decisions by providing insights, recommendations, and optimization strategies related to credit cards, rewards, travel, shopping, and financial products.
          </p>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto mt-4">
            To support the operation of our platform, some of the links, products, services, merchants, banks, and offers displayed on FiSense may be affiliate links. This means that FiSense may earn a commission, referral fee, or other compensation when users click on certain links, apply for a product, make a purchase, or complete a qualifying transaction through our partner programs.
          </p>
        </div>

        {/* Disclosure Sections */}
        <div className="space-y-6 mb-16">
          {sections.map((section, index) => (
            <div
              key={index}
              className="rounded-xl p-6 border border-white/10"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  {section.icon}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold mb-3">{section.title}</h2>
                  <p className="text-gray-400 leading-relaxed">{section.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Notice */}
        <div className="border-t border-white/10 pt-8">
          {/* Contact */}
          <div className="text-center">
            <p className="text-gray-400">
              If you have any questions regarding this Affiliate Disclosure, please contact us at{' '}
              <a
                href="mailto:support@gofisense.com"
                className="text-white hover:underline font-medium inline-flex items-center gap-1"
              >
                <Mail className="w-4 h-4" />
                support@gofisense.com
              </a>
            </p>
          </div>
        </div>
      </div>
      <Tagline />
      <div className="mx-auto flex justify-center">{divider}</div>
      <Footer />
    </div>
  );
}
