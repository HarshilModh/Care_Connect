import api from "./axios";

export const createTask = async (data) => {
  const response = await api.post("/tasks", data);
  return response.data;
};
