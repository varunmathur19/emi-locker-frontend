import api from "@/utils/axios";

export const login = async (data) => {

    const response = await api.post("/login", data);

    return response.data;

};