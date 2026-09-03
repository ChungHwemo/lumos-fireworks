import { useState } from "react";
import { useLang } from "./Lang.tsx";
import { shareUrl } from "./share.ts";

export function ShareButton({
  title,
  className = "primary",
}: {
  title: string;
  className?: string;
}) {
  const { t } = useLang();
  const [toast, setToast] = useState("");

  return (
    <div className="share-block">
      <p className="share-line">{t.shareCopy}</p>
      <button
        type="button"
        className={className}
        onClick={async () => {
          const result = await shareUrl(title, t.shareCopy, window.location.href);
          if (result === "copied") setToast(t.copied);
        }}
      >
        {t.share}
      </button>
      {toast && <p role="status">{toast}</p>}
    </div>
  );
}
