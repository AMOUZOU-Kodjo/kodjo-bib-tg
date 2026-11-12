import axios from "axios";
import toast from "react-hot-toast";
import i18n from "../i18n";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api",
  withCredentials: true,
  timeout: 30000
});

const RETRYABLE_GET = new Set(["get", "head"]);
const MAX_RETRIES = 2;

let wakeUpToastId = null;

function isTransient(err) {
  if (err.code === "ECONNABORTED" || err.code === "ERR_CANCELED") return false;
  if (!err.response) return true;
  return err.response.status >= 500;
}

client.interceptors.response.use(
  (res) => {
    if (wakeUpToastId) {
      toast.dismiss(wakeUpToastId);
      wakeUpToastId = null;
    }
    return res;
  },
  async (err) => {
    const config = err.config || {};
    const method = String(config.method || "get").toLowerCase();
    const retryCount = config.__retryCount || 0;
    const canRetry =
      RETRYABLE_GET.has(method) &&
      isTransient(err) &&
      retryCount < MAX_RETRIES &&
      !config.__noRetry;

    if (canRetry) {
      config.__retryCount = retryCount + 1;
      const delay = 600 * 2 ** retryCount;
      await new Promise((resolve) => setTimeout(resolve, delay));
      return client(config);
    }

    const isNetworkOrTimeout =
      err.code === "ECONNABORTED" ||
      err.message?.includes("timeout") ||
      (!err.response && err.request);

    if (isNetworkOrTimeout && !wakeUpToastId) {
      wakeUpToastId = "server-wakeup";
      toast.loading(i18n.t("common.serverWaking"), {
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
