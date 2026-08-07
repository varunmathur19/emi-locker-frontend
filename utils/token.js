export const saveToken = (token) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("token", token);
  }
};


export const getToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token");
  }

  return null;
};


export const removeToken = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("token");
  }
};


// JWT Token Decode
export const getUserFromToken = () => {
  const token = getToken();

  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload;

  } catch (error) {
    console.error("Invalid Token:", error);
    return null;
  }
};


// Get Role ID
export const getRoleId = () => {
  const user = getUserFromToken();

  if (!user) return null;


  if (user.role_id !== undefined) {
    return Number(user.role_id);
  }


  if (user.user && user.user.role_id !== undefined) {
    return Number(user.user.role_id);
  }


  return null;
};