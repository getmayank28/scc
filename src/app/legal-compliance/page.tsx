import React from 'react';
import { AlertTriangle, Target, Lock, Handshake, Copyright, Mail } from 'lucide-react';
import { Header } from '@/components/Header';
import Tagline from '@/components/LandingAnimation/Tagline/Tagline';
import { divider } from '../page';
import { Footer } from '@/landing/Footer';

export default function LegalCompliance() {
  const sections = [
    {
      icon: <AlertTriangle className="w-6 h-6" />,
      title: "1. Regulatory Disclaimer",
      content: "FiSense is not a bank, NBFC, or credit card issuer. We do not underwrite, approve, or distribute any financial products directly. All financial products displayed belong to their respective issuers and are governed by their individual terms and conditions."
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: "2. Neutral & Unbiased Approach",
      content: "Our recommendations are generated using AI-driven analytics and spending pattern inputs provided by users. FiSense does not prioritize or promote any issuer based on commercial arrangements."
    },
    {
      icon: <Lock className="w-6 h-6" />,
      title: "3. Data Security & Compliance",
      content: "FiSense adheres to best practices in data privacy and cybersecurity, aligned with India's Digital Personal Data Protection Act, 2023 (DPDP Act). All user data is encrypted, processed securely, and never shared without consent."
    },
    {
      icon: <Handshake className="w-6 h-6" />,
      title: "4. Partner Compliance",
      content: "Any financial institution or affiliate partnering with FiSense must comply with RBI, NPCI, IFSCA, and other applicable regulatory guidelines."
    },
    {
      icon: <Copyright className="w-6 h-6" />,
      title: "5. Intellectual Property",
      content: "All trademarks, product names, and brand references belong to their respective owners. Unauthorized use of FiSense's content, design, or analytics framework is strictly prohibited."
    }
  ];

  return (
    <div className="min-h-screen bg-[#101010] text-white">
      <Header />
      <div className="max-w-4xl mx-auto px-6 py-16 pt-[150px]">
        {/* Header */}
        <div className="text-center mb-16">

          <h1 className="text-4xl md:text-5xl font-bold mb-6">Legal & Compliance</h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            FiSense is a digital platform that provides users with data-driven insights and unbiased comparisons of credit cards and financial products.
          </p>
        </div>

        {/* Compliance Sections */}
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

        {/* Regulatory Badges */}
        <div className="rounded-xl p-6 border  border-white/10 mb-8">
          <h3 className="text-lg font-semibold mb-4 text-center">Aligned With</h3>
          <div className="flex flex-wrap justify-center gap-3">
            <span className="px-4 py-2 bg-white/10 rounded-full text-sm font-medium">DPDP Act 2023</span>
            <span className="px-4 py-2 bg-white/10 rounded-full text-sm font-medium">RBI Guidelines</span>
            <span className="px-4 py-2 bg-white/10 rounded-full text-sm font-medium">NPCI Standards</span>
            <span className="px-4 py-2 bg-white/10 rounded-full text-sm font-medium">IFSCA</span>
          </div>
        </div>

        {/* Footer Notice */}
        <div className="border-t border-white/10 pt-8">

          {/* Contact */}
          <div className="text-center">
            <p className="text-gray-400">
              For compliance or partnership inquiries, reach us at{' '}
              <a
                href="mailto:compliance@fisense.in"
                className="text-white hover:underline font-medium inline-flex items-center gap-1"
              >
                <Mail className="w-4 h-4" />
                compliance@fisense.in
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