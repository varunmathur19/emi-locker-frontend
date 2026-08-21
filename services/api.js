import api from "@/utils/axios";


// =====================================================
// LOGIN
// =====================================================

export const login = async (data) => {

  const response =
    await api.post(
      "/login",
      data
    );

  return response.data;
};


// =====================================================
// GET ALL STAFF DATA
// =====================================================

export const getAllStaffData = async (
  page = 1,
  limit = 10,
  role_id = ""
) => {

  const response =
    await api.get(
      `/getAllStaffData?page=${page}&limit=${limit}&role_id=${role_id}`
    );

  return response.data;
};


// =====================================================
// ADD STAFF
// =====================================================

export const addStaff = async (data) => {

  const response =
    await api.post(
      "/add-staff",
      data
    );

  return response.data;
};


// =====================================================
// GET DROPDOWN USERS
// =====================================================

export const getDropdownUsers = async (
  role_id,
  parent_id = null
) => {

  const params =
    new URLSearchParams();

  params.append(
    "role_id",
    role_id
  );

  if (parent_id) {

    params.append(
      "parent_id",
      parent_id
    );

  }

  const response =
    await api.get(
      `/hierarchy-dropdown?${params.toString()}`
    );

  return response.data;
};


// =====================================================
// LOGOUT STAFF
// =====================================================

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


// =====================================================
// UPDATE STAFF DATA
// =====================================================

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


// =====================================================
// GET STAFF DATA BY ID
// =====================================================

export const getStaffDataById = async (
  id
) => {

  const response =
    await api.get(
      `/staff-data/${id}`
    );

  return response.data;
};


// =====================================================
// LOGIN AS USER
// =====================================================
// Master Admin / Admin
// Login as another user
// =====================================================

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


// =====================================================
// ADD MODULE
// =====================================================
// POST /api/add-module
//
// BODY:
// {
//   "module": "ramm"
// }
// =====================================================

export const addModule = async (
  module,
  icon
) => {

  try {

    const formData =
      new FormData();

    formData.append(
      "module",
      module
    );

    formData.append(
      "icon",
      icon
    );

    console.log(
      "ADD MODULE:",
      module
    );

    console.log(
      "ADD MODULE ICON:",
      icon
    );

    const response =
      await api.post(
        "/add-module",
        formData
      );

    console.log(
      "ADD MODULE RESPONSE:",
      response.data
    );

    return response.data;

  } catch (error) {

    console.error(
      "ADD MODULE ERROR:",
      error?.response?.data ||
      error
    );

    throw error;

  }

};


// =====================================================
// GET MODULES
// =====================================================
// GET /api/modules
// =====================================================

export const getModules = async () => {

  try {

    const response =
      await api.get(
        "/modules"
      );

    console.log(
      "GET MODULES RESPONSE:",
      response.data
    );

    return response.data;

  } catch (error) {

    console.error(
      "GET MODULES ERROR:",
      error?.response?.data ||
      error
    );

    throw error;

  }

};


// =====================================================
// DELETE MODULE
// =====================================================
// DELETE /api/delete-module
//
// BODY:
// {
//   "module": "ramm"
// }
// =====================================================

export const deleteModule = async (
  moduleName
) => {

  try {

    console.log(
      "DELETE MODULE NAME:",
      moduleName
    );

    const response =
      await api.delete(
        "/delete-module",
        {
          data: {
            module: moduleName,
          },

          headers: {
            "Content-Type":
              "application/json",
          },
        }
      );

    console.log(
      "DELETE MODULE RESPONSE:",
      response.data
    );

    return response.data;

  } catch (error) {

    console.error(
      "DELETE MODULE ERROR:",
      error?.response?.data ||
      error
    );

    throw error;

  }

};

export const updateModule = async (oldModule, newModule) => {
  const response = await api.put(
    "/update-module",
    {
      oldModule,
      newModule,
    }
  );

  return response.data;
};