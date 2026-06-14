import { useState, useEffect } from "react";

export function useAsync(load, deps = []) {
  const [state, setState] = useState({ loading: true, data: null, error: "" });
  const refresh = async () => {
    setState((current) => ({ ...current, loading: true, error: "" }));
    try {
      setState({ loading: false, data: await load(), error: "" });
    } catch (error) {
      setState({ loading: false, data: null, error: error.message });
    }
  };
  useEffect(() => {
    refresh();
  }, deps);
  return { ...state, refresh };
}
