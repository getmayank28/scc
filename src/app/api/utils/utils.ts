export const generateVerificationCode = () => {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  // 10 minutes expiry
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + 10);

  return { code, expiry };
};
