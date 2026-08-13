// ==========================================
// SAVE TOKEN
// ==========================================

export const saveToken = (token) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("token", token);
  }
};


// ==========================================
// GET TOKEN
// ==========================================

export const getToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token");
  }

  return null;
};


// ==========================================
// REMOVE TOKEN
// ==========================================

export const removeToken = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }
};


// ==========================================
// JWT TOKEN DECODE
// ==========================================

export const getUserFromToken = () => {
  const token = getToken();

  if (!token) return null;

  try {
    const payload = JSON.parse(
      atob(token.split(".")[1])
    );

    return payload;
  } catch (error) {
    console.error("Invalid Token:", error);
    return null;
  }
};


// ==========================================
// GET ROLE ID
// ==========================================

export const getRoleId = () => {
  const user = getUserFromToken();

  if (!user) return null;

  return user.role_id !== undefined
    ? Number(user.role_id)
    : null;
};


// ==========================================
// SAVE USER
// ==========================================

export const saveUser = (user) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(
      "user",
      JSON.stringify(user)
    );
  }
};


// ==========================================
// GET USER FROM LOCAL STORAGE
// ==========================================

export const getUser = () => {
  if (typeof window !== "undefined") {
    const user = localStorage.getItem("user");

    if (!user) return null;

    try {
      return JSON.parse(user);
    } catch (error) {
      console.error(
        "Invalid user data:",
        error
      );

      return null;
    }
  }

  return null;
};