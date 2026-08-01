// Plan levels come from the backend (/auth/me, /auth/login) as `user.plan`,
// derived from confirmed UPI payments for the account email.
export const PLAN_LEVEL = { free: 0, pro: 1, enterprise: 2 };

// Higher of { free, pro, enterprise } the user currently has.
export const planLevel = (user) => PLAN_LEVEL[user?.plan] ?? 0;

// Admins always have access; otherwise compare against the required tier.
export const hasPlan = (user, min = 'pro') => {
  if (user?.role === 'super_admin' || user?.role === 'company_admin') return true;
  return planLevel(user) >= (PLAN_LEVEL[min] ?? 0);
};
