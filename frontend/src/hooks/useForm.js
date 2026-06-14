import { useState } from "react";

export function useForm(initial) {
  const [values, setValues] = useState(initial);
  const set = (key, value) => setValues((current) => ({ ...current, [key]: value }));
  const reset = () => setValues(initial);
  return { values, set, setValues, reset };
}
