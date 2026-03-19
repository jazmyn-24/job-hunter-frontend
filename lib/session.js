export const saveSession = (data) => {
  localStorage.setItem('jh_session', JSON.stringify(data));
};

export const getSession = () => {
  try {
    const s = localStorage.getItem('jh_session');
    return s ? JSON.parse(s) : null;
  } catch { return null; }
};

export const clearSession = () => {
  localStorage.removeItem('jh_session');
};

export const isOnboarded = () => {
  const s = getSession();
  return s?.onboardingComplete === true;
};

export const getOrCreateSessionId = () => {
  try {
    const existing = localStorage.getItem('jh_session_id');
    if (existing) return existing;
    const id = crypto.randomUUID();
    localStorage.setItem('jh_session_id', id);
    return id;
  } catch { return null; }
};
