import api from "@/utils/axios";

export const login = async (data) => {
    const response = await api.post("/login", data);
    return response.data;
};


export const getAllStaffData = async(
page=1,
limit=10,
role_id=""
)=>{


const response = await api.get(
`/getAllStaffData?page=${page}&limit=${limit}&role_id=${role_id}`
);


return response.data;


};


export const addStaff = async (data) => {

  const response = await api.post(
    "/add-staff",
    data
  );

  return response.data;

};


export const getDropdownUsers = async (role_id, parent_id = null) => {
  const params = new URLSearchParams();

  params.append("role_id", role_id);

  if (parent_id) {
    params.append("parent_id", parent_id);
  }

  const res = await api.get(
    `/hierarchy-dropdown?${params.toString()}`
  );

  return res.data;
};


export const logoutStaff = async () => {

  const token = localStorage.getItem("token");

  // console.log("Logout Token:", token);

  const response = await axios.post(
    "/logout-staff",
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  // console.log("Logout API Response:", response.data);

  return response.data;
};

//UPDATED USER_STAFF
export const updateStaffData = async (id, data) => {
  const response = await api.patch(
    `/update-staff-data/${id}`,
    data
  );

  return response.data;
};

//auto fill data  in upadted user staff 
export const getStaffDataById = async (id) => {
  const res = await api.get(`/staff-data/${id}`);
  return res.data;
};

// LOGIN AS USER
// Master Admin / Admin -> Login as another user
// ==========================================

export const loginAsUser = async (
  user_id
) => {
  const response = await api.post(
    "/login-as-user",
    {
      user_id,
    }
  );

  return response.data;
};

