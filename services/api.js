import api from "@/utils/axios";


// LOGIN

export const login = async (data) => {

  const response =
    await api.post(
      "/login",
      data
    );

  return response.data;
};


// GET ALL STAFF DATA

export const getAllStaffData = async (
  page = 1,
  limit = 10,
  role_id = "",
  search = "",
  status = ""
) => {
  const response = await api.get(
    `/getAllStaffData?page=${page}&limit=${limit}&role_id=${role_id}&search=${encodeURIComponent(
      search
    )}&status=${encodeURIComponent(status)}`
  );

  return response.data;
};


// ADD STAFF
export const addStaff = async (data) => {
  try {
    const response = await api.post("/add-staff", data);

    return response.data;
  } catch (error) {
    console.error(
      "ADD STAFF API ERROR:",
      error?.response?.data || error.message
    );

    throw error;
  }
};

// GET DROPDOWN USERS
export const getDropdownUsers = async (
  role_id,
  parent_id = null,
  search = ""
) => {
  const params = new URLSearchParams();

  // =========================================
  // ROLE ID
  // =========================================

  params.append(
    "role_id",
    Number(role_id)
  );

  // =========================================
  // PARENT ID
  // =========================================

  if (
    parent_id !== null &&
    parent_id !== undefined &&
    parent_id !== ""
  ) {
    params.append(
      "parent_id",
      Number(parent_id)
    );
  }

  // =========================================
  // SEARCH
  // =========================================

  if (
    search &&
    search.trim()
  ) {
    params.append(
      "search",
      search.trim()
    );
  }

  // =========================================
  // API CALL
  // =========================================

  const response = await api.get(
    `/hierarchy-dropdown?${params.toString()}`
  );

  return response.data;
};


// LOGOUT STAFF

export const logoutStaff = async () => {

  const token =
    localStorage.getItem("token");

  const response =
    await api.post(
      "/logout-staff",
      {},
      {
        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );

  return response.data;
};


// UPDATE STAFF DATA

export const updateStaffData = async (
  id,
  data
) => {

  const response =
    await api.patch(
      `/update-staff-data/${id}`,
      data
    );

  return response.data;
};


// GET STAFF DATA BY ID

export const getStaffDataById = async (id) => {
  try {
    const response = await api.get(`/staff-data/${id}`);

    return response.data;
  } catch (error) {
    console.error(
      "GET STAFF DATA BY ID ERROR:",
      error?.response?.data || error?.message || error
    );

    throw error;
  }
};


// LOGIN AS USER
// Master Admin / Admin
// Login as another user

export const loginAsUser = async (
  user_id
) => {

  const response =
    await api.post(
      "/login-as-user",
      {
        user_id,
      }
    );

  return response.data;
};


// GET MODULES


export const getModules = async () => {
  try {
    const response = await api.get("/modules");

    console.log(
      "GET MODULES RESPONSE:",
      response.data
    );

    return response.data;
  } catch (error) {
    console.error(
      "GET MODULES ERROR:",
      error?.response?.data || error
    );

    throw error;
  }
};



// UPDATE MODULE
export const updateModule = async ({ id, status }) => {
    try {
        const response = await api.put(`/update-module/${id}`, {
            status: Number(status)
        });

        return response.data;
    } catch (error) {
        console.error(
            "UPDATE MODULE API ERROR:",
            error?.response?.data || error.message
        );
        throw error;
    }
};


// UPDATE USER STATUS
export const updateUserStatus = async (
  user_id,
  userStatus
) => {

  try {

    const response =
      await api.patch(
        "/user-status",
        {
          user_id,
          userStatus,
        }
      );

    console.log(
      "UPDATE USER STATUS RESPONSE:",
      response.data
    );

    return response.data;

  } catch (error) {

    console.error(
      "UPDATE USER STATUS ERROR:",
      error?.response?.data ||
      error
    );

    throw error;

  }

};

//get sub module
export const getSubModules = async () => {
    try {
        const response = await api.get("/sub-modules");

        if (!response?.data) {
            throw new Error("Invalid sub modules API response");
        }

        return response.data;
    } catch (error) {
        console.error(
            "GET SUB MODULES API ERROR:",
            error?.response?.data || error?.message || error
        );
        throw error;
    }
};
//edit sub module
export const updateSubModule = async ({ id, status }) => {
    try {
        const response = await api.put(`/sub-modules/${id}`, {
            status: Number(status)
        });

        return response.data;
    } catch (error) {
        console.error(
            "UPDATE SUB MODULE API ERROR:",
            error?.response?.data || error.message
        );
        throw error;
    }
};


//get role data
export const getRoles = async () => {
  try {
    const response = await api.get("/roles");

    return response.data;
  } catch (error) {
    console.error(
      "GET ROLES API ERROR:",
      error?.response?.data || error.message
    );

    throw error;
  }
};


//   GET PROFILES
export const getProfiles = async () => {
  try {
    const response = await api.get("/profiles");

    return response.data;
  } catch (error) {
    console.error(
      "GET PROFILES API ERROR:",
      error?.response?.data || error.message
    );

    throw error;
  }
};

// POST Profile 
export const createProfile = async (payload) => {
  const response = await api.post("/profiles", payload);
  return response.data;
};


//update profile
export const updateProfile = async (id, payload) => {
  const response = await api.put(`/profiles/${id}`, payload);
  return response.data;
};


export const deleteRole = async (
  roleId
) => {
  const response = await api.delete(
    `/roles/${roleId}`
  );

  return response.data;
};

//post rolePremission
export const saveRolePermissions = async (payload) => {
  try {
    const response = await api.post(
      "/role-permissions",
      payload
    );

    return response.data;
  } catch (error) {
    console.error(
      "SAVE ROLE PERMISSIONS API ERROR:",
      error?.response?.data || error.message
    );

    throw error;
  }
};

//get role and permission
export const getRolePermissions = async (profileId) => {
  try {
    const response = await api.get(
      `/role-permissions/${profileId}`
    );

    return response.data;
  } catch (error) {
    console.error(
      "GET ROLE PERMISSIONS API ERROR:",
      error?.response?.data || error.message
    );

    throw error;
  }
};


//country ,state, city

const MASTER_DATA_URL =
    "https://untracked-denyse-riftless.ngrok-free.dev";

const masterDataRequest = async (url) => {
    const response = await fetch(url, {
        method: "GET",
        headers: {
            Accept: "application/json",
            "ngrok-skip-browser-warning": "true",
        },
        cache: "no-store",
    });

    const text = await response.text();

    let data = {};

    try {
        data = text ? JSON.parse(text) : {};
    } catch {
        throw new Error(
            "Invalid response from master data API"
        );
    }

    if (!response.ok) {
        throw new Error(
            data?.message ||
                data?.error ||
                `Request failed with status ${response.status}`
        );
    }

    return data;
};

