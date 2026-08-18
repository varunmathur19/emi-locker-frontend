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

// ==========================================
// SAVE ORIGINAL LOGIN
// ==========================================

export const saveOriginalLogin = (
  token,
  user
) => {
  if (typeof window === "undefined") {
    return;
  }

  if (!token) {
    console.error(
      "Original login token missing"
    );

    return;
  }

  localStorage.setItem(
    "original_token",
    token
  );

  if (user) {
    localStorage.setItem(
      "original_user",
      JSON.stringify(user)
    );
  }

  console.log(
    "Original Login Saved:",
    user
  );
};


// ==========================================
// GET ORIGINAL TOKEN
// ==========================================

export const getOriginalToken = () => {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(
    "original_token"
  );
};


// ==========================================
// GET ORIGINAL USER
// ==========================================

export const getOriginalUser = () => {
  if (typeof window === "undefined") {
    return null;
  }

  const user =
    localStorage.getItem(
      "original_user"
    );

  if (!user) {
    return null;
  }

  try {
    return JSON.parse(user);
  } catch (error) {
    console.error(
      "Invalid original user:",
      error
    );

    return null;
  }
};


// ==========================================
// RESTORE ORIGINAL LOGIN
// ==========================================

export const restoreOriginalLogin = () => {
  if (typeof window === "undefined") {
    return false;
  }

  const originalToken =
    localStorage.getItem(
      "original_token"
    );

  const originalUser =
    localStorage.getItem(
      "original_user"
    );

  if (!originalToken) {
    console.error(
      "Original login token not found"
    );

    return false;
  }

  // Current token replace
  localStorage.setItem(
    "token",
    originalToken
  );

  // Current user replace
  if (originalUser) {
    localStorage.setItem(
      "user",
      originalUser
    );
  }

  return true;
};


// ==========================================
// REMOVE ORIGINAL LOGIN
// ==========================================

export const removeOriginalLogin = () => {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(
    "original_token"
  );

  localStorage.removeItem(
    "original_user"
  );
};