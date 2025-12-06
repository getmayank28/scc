import bcrypt from "bcrypt";

export const validatePassword = async (password: string, hashed: string) => {
  return bcrypt.compare(password, hashed);
};
