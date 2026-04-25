import React from 'react';
import { Lock, Eye, Cookie, FileText, Mail, Shield, Clock, UserCheck, Link2, Bell, Share2, RefreshCw } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/landing/Footer';
import Tagline from '@/components/LandingAnimation/Tagline/Tagline';
import { divider } from '../../../public/images/divider';

export default function PrivacyPolicy() {
  const sections = [
    {
      icon: <FileText className="w-6 h-6" />,
      title: "1. Information We Collect",
      content: (
        <>
          <p className="mb-3 font-medium">a) Information You Provide</p>
          <ul className="list-disc list-inside space-y-1 mb-4">
            <li>Mobile number (used for login, communication, and identity verification)</li>
            <li>Basic profile details such as employment type and income range</li>
            <li>Spending preferences and financial habits you voluntarily share</li>
            <li>Any other information you provide while using our platform</li>
          </ul>
          <p className="mb-3 font-medium">b) Usage & Technical Information</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Interactions with our platform and features</li>
            <li>Device type and browser information</li>
            <li>Log data including IP address and timestamps</li>
            <li>Cookie and tracking data (see Section 5)</li>
          </ul>
        </>
      )
    },
    {
      icon: <Eye className="w-6 h-6" />,
      title: "2. How We Use Your Information",
      content: (
        <>
          <p className="mb-3">Your information is used solely for the following purposes:</p>
          <ul className="list-disc list-inside space-y-1 mb-4">
            <li>Provide personalised credit card recommendations tailored to your profile</li>
            <li>Help you optimise rewards, cashback, and spending benefits</li>
            <li>Send important updates, alerts, and financial insights</li>
            <li>Improve our algorithms, product features, and user experience</li>
            <li>Ensure platform security and prevent fraud or misuse</li>
            <li>Comply with applicable legal and regulatory obligations</li>
          </ul>
          <p>We do not use your data for purposes beyond those stated above without your explicit consent.</p>
        </>
      )
    },
    {
      icon: <Bell className="w-6 h-6" />,
      title: "3. Communication & WhatsApp Consent",
      content: (
        <>
          <p className="mb-3">By providing your mobile number and explicitly opting in during registration, you consent to receive communications from FiSense via WhatsApp and other channels, including:</p>
          <ul className="list-disc list-inside space-y-1 mb-4">
            <li>Credit card recommendations and comparisons</li>
            <li>Reward alerts, cashback updates, and spending insights</li>
            <li>Relevant offers and platform updates</li>
          </ul>
          <p className="mb-3">You may withdraw this consent and opt out at any time by:</p>
          <ul className="list-disc list-inside space-y-1 mb-4">
            <li>Clicking the unsubscribe link in any communication</li>
            <li>Writing to us at <a href="mailto:grievances@gofisense.com" className="text-white hover:underline font-medium">grievances@gofisense.com</a></li>
          </ul>
          <p>We do not send unsolicited messages. Communication is limited to relevant, platform-related updates only.</p>
        </>
      )
    },
    {
      icon: <Share2 className="w-6 h-6" />,
      title: "4. Data Sharing & Disclosure",
      content: (
        <>
          <p className="mb-3">We value your trust and handle your data with care:</p>
          <ul className="list-disc list-inside space-y-2">
            <li>We do <strong>NOT</strong> sell your personal data to any third party.</li>
            <li>We do <strong>NOT</strong> share your sensitive personal data without your explicit consent.</li>
            <li>We may share limited, non-sensitive operational data with trusted service providers (such as cloud hosting, analytics, and communication platforms) strictly for the purpose of operating and improving our services. These providers are contractually bound to process data only as directed by us.</li>
            <li>We may share your information with banking or card-issuer partners only when you actively choose to proceed with an offer or application on our platform. By clicking to apply, you acknowledge that your data will be shared with the relevant partner for processing your application.</li>
            <li>We may disclose your information if required to do so by law, court order, or government authority.</li>
          </ul>
        </>
      )
    },
    {
      icon: <Cookie className="w-6 h-6" />,
      title: "5. Cookies & Tracking Technologies",
      content: (
        <>
          <p className="mb-3">We use the following types of cookies and tracking tools:</p>
          <ul className="list-disc list-inside space-y-1 mb-4">
            <li><strong>Essential cookies:</strong> Required for the platform to function correctly</li>
            <li><strong>Analytics cookies:</strong> Help us understand how users interact with our site (e.g., Google Analytics)</li>
            <li><strong>Advertising cookies:</strong> Used to measure the effectiveness of our marketing campaigns</li>
          </ul>
          <p>You can control or disable cookies at any time through your browser settings. Note that disabling certain cookies may affect platform functionality. Where required by law, we will obtain your consent before placing non-essential cookies.</p>
        </>
      )
    },
    {
      icon: <Lock className="w-6 h-6" />,
      title: "6. Data Security",
      content: (
        <>
          <p className="mb-3">We implement industry-standard security practices to protect your data, including:</p>
          <ul className="list-disc list-inside space-y-1 mb-4">
            <li>End-to-end encryption for data in transit and at rest</li>
            <li>Secure servers with restricted access controls</li>
            <li>Regular security audits and vulnerability assessments</li>
          </ul>
          <p>While we take all reasonable precautions, no system is completely immune to risk. In the event of a data breach that is likely to affect your rights or interests, we will notify you and the relevant authorities as required under applicable law.</p>
        </>
      )
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "7. Data Retention",
      content: (
        <>
          <p className="mb-3">We retain your personal data only for as long as necessary to:</p>
          <ul className="list-disc list-inside space-y-1 mb-4">
            <li>Provide our services to you</li>
            <li>Comply with applicable legal and regulatory obligations</li>
            <li>Resolve disputes or enforce our agreements</li>
          </ul>
          <p>As a general guideline, account data is retained for up to 2 years following your last active use of the platform, after which it is securely deleted or anonymised. You may request earlier deletion at any time (see Section 8).</p>
        </>
      )
    },
    {
      icon: <UserCheck className="w-6 h-6" />,
      title: "8. Your Rights",
      content: (
        <>
          <p className="mb-3">Under applicable Indian law including the DPDPA 2023, you have the right to:</p>
          <ul className="list-disc list-inside space-y-1 mb-4">
            <li>Access the personal data we hold about you</li>
            <li>Request correction of any inaccurate or incomplete data</li>
            <li>Request deletion of your data (subject to legal retention obligations)</li>
            <li>Withdraw consent for communication or data processing at any time</li>
            <li>Nominate a representative to exercise your rights on your behalf</li>
          </ul>
          <p>To exercise any of these rights, please contact our Grievance Officer (see Section 12). We will respond to requests within a reasonable timeframe and in accordance with applicable law.</p>
        </>
      )
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "9. Eligibility & Minors",
      content: (
        <p>FiSense is intended for use by individuals who are 18 years of age or older. We do not knowingly collect personal data from minors. If you believe we have inadvertently collected data from a person under 18, please contact us immediately at <a href="mailto:grievances@gofisense.com" className="text-white hover:underline font-medium">grievances@gofisense.com</a> and we will take prompt action to delete such information.</p>
      )
    },
    {
      icon: <Link2 className="w-6 h-6" />,
      title: "10. Third-Party Links",
      content: (
        <p>Our platform may contain links to third-party websites, including banking partners and card issuers. Once you navigate to a third-party site, this Privacy Policy no longer applies. We encourage you to review the privacy policies of any third-party services before sharing your information with them. FiSense is not responsible for the privacy practices or content of such external sites.</p>
      )
    },
    {
      icon: <RefreshCw className="w-6 h-6" />,
      title: "11. Changes to This Policy",
      content: (
        <p>We may update this Privacy Policy from time to time to reflect changes in our practices, technology, or legal requirements. When we make material changes, we will post the revised policy on this page with an updated &quot;Last Updated&quot; date and, where appropriate, notify you via email or WhatsApp. Your continued use of our services after any update constitutes your acceptance of the revised policy.</p>
      )
    },
    {
      icon: <Mail className="w-6 h-6" />,
      title: "12. Grievance Officer & Contact",
      content: (
        <>
          <p className="mb-3">In accordance with the Information Technology Act, 2000 and the DPDPA 2023, FiSense has designated a Grievance Officer to address any concerns regarding the processing of your personal data.</p>
          <div className="mb-4">
            <p className="font-medium mb-1">Grievance Officer</p>
            <p>FiSense Privacy & Grievance Team</p>
            <p>Email: <a href="mailto:grievances@gofisense.com" className="text-white hover:underline font-medium">grievances@gofisense.com</a></p>
            <p>Website: <a href="https://www.gofisense.com" target="_blank" rel="noopener noreferrer" className="text-white hover:underline font-medium">www.gofisense.com</a></p>
          </div>
          <p>We are committed to resolving all privacy-related concerns promptly and fairly. You may reach out to us at any time with questions, requests, or complaints regarding how we handle your personal data.</p>
        </>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-[#101010] text-white">
      <Header />
      <div className="max-w-4xl mx-auto px-6 py-16 pt-[150px]">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-sm text-gray-500 mb-6">Last Updated: 24 April 2026</p>
          <p className="text-md text-justify text-gray-400 max-w-3xl mx-auto">
            FiSense (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) is committed to protecting your privacy and ensuring full transparency in how your personal information is collected, used, and safeguarded. This Privacy Policy applies to your use of our website and services at{' '}
            <a href="https://www.gofisense.com" target="_blank" rel="noopener noreferrer" className="text-white hover:underline font-medium">www.gofisense.com</a>
            {' '}and is governed by the Information Technology Act, 2000, the IT (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011, and the Digital Personal Data Protection Act, 2023 (DPDPA).
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
                  <div className="text-gray-400 leading-relaxed">{section.content}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Contact */}
        <div className="text-center mt-12 space-y-2">
          <p className="text-gray-400 font-medium">
            FiSense |{' '}
            <a href="https://www.gofisense.com" target="_blank" rel="noopener noreferrer" className="text-white hover:underline">www.gofisense.com</a>
            {' '}|{' '}
            <a href="mailto:grievances@gofisense.com" className="text-white hover:underline">grievances@gofisense.com</a>
          </p>
        </div>
      </div>
      <Tagline />
      <div className="mx-auto flex justify-center">{divider}</div>
      <Footer />
    </div>
  );
}