export const generateVerificationCode = () => {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + 1);

  return { code, expiry };
};
