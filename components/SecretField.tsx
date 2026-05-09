"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

export function SecretField({ hiddenLabel, value }: { hiddenLabel: string; value: string }) {
  const [visible, setVisible] = useState(false);

  return (
    <button className="secret-field" onClick={() => setVisible((current) => !current)} type="button">
      {visible ? <EyeOff size={15} /> : <Eye size={15} />}
      {visible ? value : hiddenLabel}
    </button>
  );
}
