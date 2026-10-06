// Score a password from 0-5 based on length and character variety
export const getStrength = (password) => {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { label: "Weak", color: "bg-red-500", percent: 33 };
  if (score <= 4) return { label: "Medium", color: "bg-yellow-500", percent: 66 };
  return { label: "Strong", color: "bg-green-500", percent: 100 };
};

// Generate a random password using the browser's secure RNG
export const generatePassword = (length = 16) => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+";
  const values = new Uint32Array(length);
  crypto.getRandomValues(values);
  return Array.from(values, (v) => chars[v % chars.length]).join("");
};
