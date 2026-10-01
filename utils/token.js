export const saveToken = (token) => {
  if (typeof window !== "undefined" && token) {
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
    localStorage.removeItem("user");
  }
};

export const getUserFromToken = () => {
  const token = getToken();

  if (!token) {
    return null;
  }

  try {
    const payload = token.split(".")[1];

    if (!payload) {
      return null;
    }

    const base64 = payload
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map(
          (char) =>
            "%" +
            ("00" + char.charCodeAt(0).toString(16)).slice(-2)
        )
        .join("")
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Invalid Token:", error);
    return null;
  }
};

export const getRoleId = () => {
  const user = getUserFromToken();

  if (!user || user.role_id === undefined || user.role_id === null) {
    return null;
  }

  return Number(user.role_id);
};

export const saveUser = (user) => {
  if (typeof window !== "undefined" && user) {
    localStorage.setItem("user", JSON.stringify(user));
  }
};

export const getUser = () => {
  if (typeof window !== "undefined") {
    const user = localStorage.getItem("user");

    if (!user) {
      return null;
    }

    try {
      return JSON.parse(user);
    } catch (error) {
      console.error("Invalid user data:", error);
      return null;
    }
  }

  return null;
};

export const saveOriginalLogin = (token, user) => {
  if (typeof window === "undefined") {
    return false;
  }

  if (!token) {
    console.error("Original login token missing");
    return false;
  }

  const existingOriginalToken =
    localStorage.getItem("original_token");

  if (!existingOriginalToken) {
    localStorage.setItem("original_token", token);

    if (user) {
      localStorage.setItem(
        "original_user",
        JSON.stringify(user)
      );
    }
  }

  return true;
};

export const getOriginalToken = () => {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem("original_token");
};

export const getOriginalUser = () => {
  if (typeof window === "undefined") {
    return null;
  }

  const user = localStorage.getItem("original_user");

  if (!user) {
    return null;
  }

  try {
    return JSON.parse(user);
  } catch (error) {
    console.error("Invalid original user:", error);
    return null;
  }
};

export const hasOriginalLogin = () => {
  if (typeof window === "undefined") {
    return false;
  }

  return !!localStorage.getItem("original_token");
};

export const restoreOriginalLogin = () => {
  if (typeof window === "undefined") {
    return false;
  }

  const originalToken =
    localStorage.getItem("original_token");

  const originalUser =
    localStorage.getItem("original_user");

  if (!originalToken) {
    console.error("Original login token not found");
    return false;
  }

  localStorage.setItem("token", originalToken);

  if (originalUser) {
    localStorage.setItem("user", originalUser);
  }

  return true;
};

export const removeOriginalLogin = () => {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem("original_token");
  localStorage.removeItem("original_user");
};

export const clearAllLoginData = () => {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("original_token");
  localStorage.removeItem("original_user");
};

export const getOriginalRoleId = () => {
  if (typeof window === "undefined") {
    return null;
  }

  const originalUser = getOriginalUser();

  if (
    originalUser &&
    originalUser.role_id !== undefined &&
    originalUser.role_id !== null
  ) {
    return Number(originalUser.role_id);
  }

  const originalToken = getOriginalToken();

  if (!originalToken) {
    return null;
  }

  try {
    const payload = originalToken.split(".")[1];

    if (!payload) {
      return null;
    }

    const base64 = payload
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map(
          (char) =>
            "%" +
            ("00" + char.charCodeAt(0).toString(16)).slice(-2)
        )
        .join("")
    );

    const decoded = JSON.parse(jsonPayload);

    if (
      decoded.role_id === undefined ||
      decoded.role_id === null
    ) {
      return null;
    }

    return Number(decoded.role_id);
  } catch (error) {
    console.error("Original Role Decode Error:", error);
    return null;
  }
};