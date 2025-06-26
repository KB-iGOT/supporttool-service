export const getCookie = (name: string) => {
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift();
  if(name === 'userId') {
    return localStorage.getItem(name) ? localStorage.getItem(name) : null;
  }
  return null;
};

export const decodeCookie = (cookie: string) => {
  const decoded = decodeURIComponent(cookie);
  const jsonString = decoded.startsWith("j:") ? decoded.slice(2) : decoded;

  try {
    const parsed = JSON.parse(jsonString);
    const { name, id: userId, roles, token, userName,email,rolePermissions } = parsed;
    return { name, userId, roles, token, userName, email, rolePermissions };
  } catch (error) {
    console.error("Invalid JSON cookie", error);
    return null;
  }
};
