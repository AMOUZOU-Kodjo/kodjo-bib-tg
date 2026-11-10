import { useEffect, useState } from "react";
import { getCategories } from "../api/categories";
import { useLiveVersion } from "../context/LiveUpdatesContext";

export default function useCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const version = useLiveVersion(["categories", "documents"]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getCategories()
      .then((res) => {
        if (active) setCategories(res.data.categories || []);
      })
      .catch(() => {
        if (active) setCategories([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [version]);

  return { categories, loading };
}
