import * as React from 'react';

interface EmailTemplateProps {
  username: string;
  verificationCode:string;
}

export function EmailTemplate({ username, verificationCode }: EmailTemplateProps) {
  return (
    <div>
      <h1>Welcome, {username}!</h1>
      <h1>Your OTP, {verificationCode}!</h1>
    </div>
  );
}