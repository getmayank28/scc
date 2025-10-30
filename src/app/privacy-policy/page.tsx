import React from 'react';
import { Shield, Lock, Eye, Cookie, FileText, Mail } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/landing/Footer';
import Tagline from '@/components/LandingAnimation/Tagline/Tagline';
import { divider } from '../page';

export default function PrivacyPolicy() {
  const sections = [
    {
      icon: <FileText className="w-6 h-6" />,
      title: "1. Information We Collect",
      content: "We collect only the information you share with us — such as your name, contact details, and spending preferences — to help you get personalized credit card recommendations."
    },
    {
      icon: <Eye className="w-6 h-6" />,
      title: "2. How We Use It",
      content: "Your data is used solely to improve your experience, generate accurate insights, and show you unbiased card matches. We do not sell or share your personal information with third parties."
    },
    {
      icon: <Lock className="w-6 h-6" />,
      title: "3. Data Security",
      content: "All information is encrypted and stored using secure servers and industry-standard protection protocols."
    },
    {
      icon: <Cookie className="w-6 h-6" />,
      title: "4. Cookies",
      content: "We may use cookies to enhance your browsing experience and understand how you use our site. You can choose to disable cookies in your browser settings."
    },
    {
      icon: <Mail className="w-6 h-6" />,
      title: "5. Your Rights",
      content: "You can request deletion or correction of your data anytime by writing to us at support@fisense.in."
    }
  ];

  return (
    <div className="min-h-screen bg-[#101010] text-white">
      <Header />
      <div className="max-w-4xl mx-auto px-6 py-16 pt-[150px]">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Privacy Policy</h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            At FiSense, your privacy is our priority. We are committed to keeping your personal and financial information safe, secure, and confidential.
          </p>
        </div>

        {/* Policy Sections */}
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

        {/* Contact */}
        <div className="text-center mt-12">
          <p className="text-gray-400">
            Questions about our Privacy Policy?{' '}
            <a
              href="mailto:support@fisense.in"
              className="text-white hover:underline font-medium"
            >
              support@fisense.in
            </a>
          </p>
        </div>
      </div>
      <Tagline />
      <div className="mx-auto flex justify-center">{divider}</div>
      <Footer />
    </div>
  );
}