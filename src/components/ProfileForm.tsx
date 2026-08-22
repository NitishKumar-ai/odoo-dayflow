"use client";

import { useActionState, useState } from "react";
import { updateOwnProfileAction, type ActionResult } from "@/actions/profile";
import { SubmitButton } from "@/components/SubmitButton";
import { Alert } from "@/components/Alert";
import { IconCheck, IconPhone, IconMapPin, IconSparkles } from "@/components/Icons";

const initial: ActionResult = {};

export function ProfileForm({
  phone,
  address,
  photoUrl,
}: {
  phone: string;
  address: string;
  photoUrl: string;
}) {
  const [state, action] = useActionState(updateOwnProfileAction, initial);
  const [form, setForm] = useState({ phone, address, photoUrl });

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return (
    <form action={action} className="space-y-4">
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state.ok ? <Alert tone="success">{state.ok}</Alert> : null}

      <div>
        <label className="label" htmlFor="phone">
          Contact Phone Number
        </label>
        <div className="relative">
          <input
            id="phone"
            name="phone"
            type="tel"
            className="input"
            placeholder="+1 (555) 000-0000"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="address">
          Residential Address
        </label>
        <textarea
          id="address"
          name="address"
          rows={3}
          className="input"
          placeholder="Street address, City, State, ZIP..."
          value={form.address}
          onChange={(e) => set("address", e.target.value)}
        />
      </div>

      <div>
        <label className="label" htmlFor="photoUrl">
          Profile Photo Avatar URL
        </label>
        <input
          id="photoUrl"
          name="photoUrl"
          type="url"
          className="input"
          placeholder="https://images.unsplash.com/..."
          value={form.photoUrl}
          onChange={(e) => set("photoUrl", e.target.value)}
        />
        <p className="mt-1 text-[11px] text-muted">
          Provide an HTTPS image URL or leave blank to use your name initials.
        </p>
      </div>

      <SubmitButton pendingLabel="Saving Profile…" className="btn-primary w-full">
        <IconSparkles size={16} />
        <span>Update Contact Info</span>
      </SubmitButton>

      <p className="text-[11px] text-muted text-center">
        Note: Official designation, department, and salary structures are maintained by HR.
      </p>
    </form>
  );
}
