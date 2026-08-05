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