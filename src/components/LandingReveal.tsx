"use client";

import { useEffect } from "react";

export function LandingReveal() {
  useEffect(() => {
    const landing = document.querySelector<HTMLElement>("[data-landing]");
    const elements = document.querySelectorAll<HTMLElement>("[data-reveal]");
    if (!("IntersectionObserver" in window)) {
      elements.forEach((element) => (element.dataset.visible = "true"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).dataset.visible = "true";
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14 },
    );

    elements.forEach((element) => observer.observe(element));
    landing?.setAttribute("data-motion", "ready");
    return () => {
      observer.disconnect();
      landing?.removeAttribute("data-motion");
    };
  }, []);

  return null;
}
