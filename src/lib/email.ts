const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Trims and lower-cases, so "  Doc@Hospital.org " and "doc@hospital.org" are one user. */
export const normalizeEmail = (raw: unknown) => String(raw ?? "").trim().toLowerCase();

export const isValidEmail = (email: string) => email.length <= 254 && EMAIL.test(email);
