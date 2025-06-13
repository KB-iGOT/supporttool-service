export const getCookie = (name: string) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift();
  return null;
};

export const decodeCookie = (cookie: string) => {
  const decoded = decodeURIComponent(cookie);
  const jsonString = decoded.startsWith("j:") ? decoded.slice(2) : decoded;

  try {
    const parsed = JSON.parse(jsonString);
    const { name, id: userId, roles, token, userName,email } = parsed;
    return { name, userId, roles, token, userName, email };
  } catch (error) {
    console.error("Invalid JSON cookie", error);
    return null;
  }
};
