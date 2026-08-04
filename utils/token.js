export const saveToken = (token) => {
  localStorage.setItem("token", token);
};

export const getToken = () => {
  return localStorage.getItem("token");
};

export const removeToken = () => {
  localStorage.removeItem("token");
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

  // Agar role_id direct payload me hai
  if (user.role_id !== undefined) {
    return Number(user.role_id);
  }

  // Agar role_id user object ke andar hai
  if (user.user && user.user.role_id !== undefined) {
    return Number(user.user.role_id);
  }

  return null;
};