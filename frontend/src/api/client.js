import axios from "axios";
import toast from "react-hot-toast";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api",
  withCredentials: true,
  timeout: 90000
});

let wakeUpToastId = null;

client.interceptors.response.use(
  (res) => {
    if (wakeUpToastId) {
      toast.dismiss(wakeUpToastId);
      wakeUpToastId = null;
    }
    return res;
  },
  (err) => {
    const isNetworkOrTimeout =
      err.code === "ECONNABORTED" ||
      err.message?.includes("timeout") ||
      (!err.response && err.request);

    if (isNetworkOrTimeout && !wakeUpToastId) {
      wakeUpToastId = "server-wakeup";
      toast.loading("Le serveur se réveille, patientez quelques secondes...", {
        id: wakeUpToastId,
        duration: 15000
      });
    }

    if (wakeUpToastId && err.response) {
      toast.dismiss(wakeUpToastId);
      wakeUpToastId = null;
    }

    return Promise.reject(err);
  }
);

export default client;
