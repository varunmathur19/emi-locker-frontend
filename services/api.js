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

export const addModule = async (
   name,
    sequence,
    moduleIcon
) => {

  try {

    // ================================================
    // MODULE VALIDATION
    // ================================================

    const moduleName =
      String(name || "").trim();

    if (!moduleName) {

      throw new Error(
        "Module name is required"
      );

    }


    // ================================================
    // SEQUENCE VALIDATION
    // ================================================

    const moduleSequence =
      Number(sequence);

    if (
      sequence === undefined ||
      sequence === null ||
      sequence === "" ||
      !Number.isInteger(moduleSequence) ||
      moduleSequence < 1
    ) {

      throw new Error(
        "Valid sequence number is required"
      );

    }


    // ================================================
    // ICON VALIDATION
    // ================================================

    if (
      typeof File !== "undefined" &&
      !(moduleIcon instanceof File)
    ) {

      throw new Error(
        "Valid PNG icon file is required"
      );

    }


    if (!moduleIcon) {

      throw new Error(
        "Valid PNG icon file is required"
      );

    }


    // ================================================
    // PNG ONLY
    // ================================================

    if (
      moduleIcon.type !==
      "image/png"
    ) {

      throw new Error(
        "Only PNG images are allowed"
      );

    }


    // ================================================
    // MAX 20 KB
    // ================================================

    const maxSize =
      20 * 1024;

    if (
      moduleIcon.size >
      maxSize
    ) {

      throw new Error(
        "PNG icon size must not exceed 20 KB"
      );

    }


    // ================================================
    // FORM DATA
    // ================================================

    const formData =
      new FormData();


    // ================================================
    // MODULE NAME
    // ================================================

    formData.append(
      "module",
      moduleName
    );


    // ================================================
    // SEQUENCE
    // ================================================

    formData.append(
      "sequence",
      String(moduleSequence)
    );


    // ================================================
    // ICON
    // ================================================

    formData.append(
      "icon",
      moduleIcon,
      moduleIcon.name
    );


    // ================================================
    // DEBUG
    // ================================================

    console.log(
      "========== ADD MODULE =========="
    );

    console.log(
      "MODULE:",
      moduleName
    );

    console.log(
      "SEQUENCE:",
      moduleSequence
    );

    console.log(
      "ICON:",
      moduleIcon
    );

    console.log(
      "ICON NAME:",
      moduleIcon.name
    );

    console.log(
      "ICON TYPE:",
      moduleIcon.type
    );

    console.log(
      "ICON SIZE:",
      moduleIcon.size,
      "bytes"
    );


    // ================================================
    // DEBUG FORM DATA
    // ================================================

    for (
      const [
        key,
        value
      ]
      of formData.entries()
    ) {

      console.log(
        "FORM DATA:",
        key,
        value
      );

    }


    // ================================================
    // TOKEN
    // ================================================

    const token =
      typeof window !== "undefined"
        ? localStorage.getItem(
            "token"
          )
        : null;


    // ================================================
    // API CALL
    // ================================================

    const response =
      await api.post(
        "/add-module",
        formData,
        {
          headers: {

            Authorization:
              `Bearer ${token}`,

            // Content-Type manually mat lagao.
            // Axios/browser automatically
            // multipart/form-data boundary set karega.

          },
        }
      );


    // ================================================
    // RESPONSE
    // ================================================

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

export const deleteModule = async (
  module
) => {

  try {

    console.log(
      "DELETE MODULE API:",
      module
    );


    const response =
      await api.delete(
        "/delete-module",
        {
          data: {
            module,
          },
        }
      );


    console.log(
      "DELETE MODULE API RESPONSE:",
      response.data
    );


    return response.data;

  }
  catch (error) {

    console.error(
      "DELETE MODULE API ERROR:",
      error?.response?.data ||
      error
    );

    throw error;

  }

};

// =====================================================
// UPDATE MODULE
// =====================================================

export const updateModule = async (
  oldModule,
  newModule,
  icon
) => {

  try {

    const formData = new FormData();

    formData.append(
      "oldModule",
      oldModule
    );

    formData.append(
      "newModule",
      newModule
    );

    // IMPORTANT:
    // Backend upload middleware expects "newIcon"
    formData.append(
      "newIcon",
      icon
    );

    console.log(
      "UPDATE MODULE FORM DATA:",
      {
        oldModule,
        newModule,
        icon,
      }
    );

    const response =
      await api.put(
        "/update-module",
        formData
      );

    console.log(
      "UPDATE MODULE RESPONSE:",
      response.data
    );

    return response.data;

  } catch (error) {

    console.error(
      "UPDATE MODULE ERROR:",
      error?.response?.data ||
      error
    );

    throw error;

  }

};

// =====================================================
// UPDATE USER STATUS
// =====================================================

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

