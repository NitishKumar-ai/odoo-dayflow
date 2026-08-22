"use client";

import { useEffect, useRef, useState } from "react";

type FieldElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

/**
 * Keeps form inputs controlled across a server action.
 *
 * Two things go wrong without this. React resets a form once its action
 * settles, so a validation error would discard what the user typed. And for a
 * field whose controlled `value` did not change between renders, React does not
 * re-apply that value to the DOM after the reset — the node silently falls back
 * to its first option while React still believes the old value is showing. That
 * bites `<select>` hardest: the box reads "Paid leave" while state says "Sick
 * leave", and the next submit sends the wrong one.
 *
 * The sync effect below re-applies state to every registered node after each
 * commit, which runs after React's reset. On the very first commit it runs the
 * other way: a browser or password manager may have filled the form before
 * hydration, and blindly writing empty state over that would wipe saved
 * credentials, so the DOM wins once and seeds the state instead.
 */
export function useFields<T extends Record<string, string>>(
  defaults: T,
  /** Prefix for generated `id`s, needed when a form renders many times per page. */
  idPrefix = "",
) {
  const [values, setValues] = useState<T>(defaults);
  const nodes = useRef(new Map<string, FieldElement>());
  const hydrated = useRef(false);

  useEffect(() => {
    if (!hydrated.current) {
      hydrated.current = true;

      // Adopt anything already in the DOM (autofill) rather than clearing it.
      const adopted: Partial<T> = {};
      for (const [key, node] of nodes.current) {
        const filled = node.value;
        if (filled && filled !== values[key]) {
          (adopted as Record<string, string>)[key] = filled;
        }
      }
      if (Object.keys(adopted).length > 0) {
        setValues((v) => ({ ...v, ...adopted }));
        return;
      }
    }

    for (const [key, node] of nodes.current) {
      const want = values[key];
      if (want !== undefined && node.value !== want) node.value = want;
    }
  });

  function field<K extends keyof T & string>(key: K) {
    return {
      name: key,
      id: idPrefix ? `${idPrefix}-${key}` : key,
      value: values[key],
      ref: (node: FieldElement | null) => {
        if (node) nodes.current.set(key, node);
        else nodes.current.delete(key);
      },
      onChange: (e: React.ChangeEvent<FieldElement>) =>
        setValues((v) => ({ ...v, [key]: e.target.value })),
    };
  }

  return { values, field, setValues };
}
