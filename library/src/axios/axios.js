import axios from "axios";


// const BASE_URL = "http://localhost:3002" 
const BASE_URL = "https://library-pro.onrender.com"

const axiosInstance=axios.create({
    baseURL:BASE_URL,
});

export default axiosInstance; 