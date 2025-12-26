import axios from "axios";

export const fetchCartItems = async () => {
  const token = localStorage.getItem('access_token');
  if (!token) return [];

  try {
    const res = await axios.get(`https://eduverseapi-production.up.railway.app/api/v1/cart`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return res.data?.data?.items ?? [];
  } catch (error: any) {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      window.dispatchEvent(new Event('logout')); 
    }
    return [];
  }
};
