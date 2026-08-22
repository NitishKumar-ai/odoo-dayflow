"use client";

import { useState } from "react";

/**
 * Keeps form inputs controlled. React resets an uncontrolled form once its
 * action settles, so a validation error would otherwise discard what was typed.
 */
export function useFields<T extends Record<string, string>>(defaults: T) {
  const [values, setValues] = useState<T>(defaults);

  function field<K extends keyof T & string>(key: K) {
    return {
      name: key,
      id: key,
      value: values[key],
      onChange: (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
      ) => setValues((v) => ({ ...v, [key]: e.target.value })),
    };
  }

  return { values, field, setValues };
}
