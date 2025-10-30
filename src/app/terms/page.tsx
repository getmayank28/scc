import React from 'react';
import { FileText, Info, AlertCircle, Shield, Link2, RefreshCw, Mail } from 'lucide-react';
import Tagline from '@/components/LandingAnimation/Tagline/Tagline';
import { divider } from '../page';
import { Footer } from '@/landing/Footer';
import { Header } from '@/components/Header';

export default function TermsConditions() {
  const sections = [
    {
      icon: <Info className="w-6 h-6" />,
      title: "1. Use of the Platform",
      content: "FiSense helps users compare and understand credit card products offered by banks and financial institutions. The information provided is for general guidance only and should not be treated as financial advice."
    },
    {
      icon: <FileText className="w-6 h-6" />,
      title: "2. Accuracy of Information",
      content: "We strive to keep all information up to date and accurate. However, card features, offers, and terms are subject to change by issuers. We recommend verifying details directly with the respective bank or partner before applying."
    },
    {
      icon: <AlertCircle className="w-6 h-6" />,
      title: "3. No Financial Liability",
      content: "FiSense is not a bank or a financial institution. We do not issue credit cards or guarantee approvals. We are not liable for any losses or damages arising from reliance on information or services provided on this platform."
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "4. Data Privacy",
      content: "All data shared by users is handled securely and in accordance with our Privacy Policy. By using FiSense, you consent to the collection and use of your data as described there."
    },
    {
      icon: <Link2 className="w-6 h-6" />,
      title: "5. Third-Party Links",
      content: "Our platform may contain links to external websites. FiSense is not responsible for the content, accuracy, or practices of these third-party sites."
    },
    {
      icon: <RefreshCw className="w-6 h-6" />,
      title: "6. Changes to Terms",
      content: "We may update these Terms & Conditions periodically. Continued use of the platform after such changes constitutes your acceptance of the updated terms."
    }
  ];

  return (
    <div className="min-h-screen bg-[#101010] text-white">
      <Header />
      <div className="max-w-4xl mx-auto px-6 py-16 pt-[150px]">
        {/* Header */}
        <div className="text-center mb-16">

          <h1 className="text-4xl md:text-5xl font-bold mb-6">Terms & Conditions</h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Welcome to FiSense. By using our website, you agree to the following terms and conditions. Please read them carefully.
          </p>
        </div>

        {/* Terms Sections */}
        <div className="space-y-6 mb-16">
          {sections.map((section, index) => (
            <div
              key={index}
              className=" rounded-xl p-6 border border-white/10"
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
              For any queries, contact us at{' '}
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