// Asynchronous Web Crypto API SHA-256 PIN hashing helper
export const hashPin = async (pin: string): Promise<string> => {
  if (!pin) return '';
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + '_spendly_salt');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
};

export const verifyPin = async (pin: string, hashedPin: string): Promise<boolean> => {
  if (!pin || !hashedPin) return false;
  const computed = await hashPin(pin);
  return computed === hashedPin;
};
