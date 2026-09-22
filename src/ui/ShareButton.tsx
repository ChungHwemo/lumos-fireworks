import { useEffect, useState } from "react";
import { Icon } from "./Icon.tsx";
import { useLang } from "./Lang.tsx";
import { shareUrl } from "./share.ts";

const TOAST_MS = 2600;

/**
 * 현재 URL 을 공유한다. pill 은 액션 줄에 들어가는 한 알이고, block 은 설명 문장이 붙은 넓은 버튼이다.
 * 결과 안내는 버튼 라벨 자리에 잠깐 나타난다. 줄 구조가 흔들리지 않는다.
 */
export function ShareButton({
  title,
  variant = "block",
}: {
  title: string;
  variant?: "pill" | "block";
}) {
  const { t } = useLang();
  const [toast, setToast] = useState<{ text: string; error: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), TOAST_MS);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const share = async () => {
    setBusy(true);
    const result = await shareUrl(title, t.shareCopy, window.location.href);
    setBusy(false);
    if (result === "copied") setToast({ text: t.copied, error: false });
    else if (result === "failed") setToast({ text: t.shareFailed, error: true });
  };

  const button = (
    <button
      type="button"
      className={variant === "pill" ? `pill${toast?.error ? " is-error" : ""}` : "primary"}
      disabled={busy}
      onClick={share}
    >
      <Icon name="share" size={15} /> {variant === "pill" && toast ? toast.text : t.share}
    </button>
  );

  if (variant === "pill") {
    return (
      <>
        {button}
        {toast && (
          <span className="sr-only" role={toast.error ? "alert" : "status"}>
            {toast.text}
          </span>
        )}
      </>
    );
  }
  return (
    <div className="share-block">
      <p className="share-line">{t.shareCopy}</p>
      {button}
      {toast && (
        <p role={toast.error ? "alert" : "status"} className={toast.error ? "form-error" : "form-note"}>
          {toast.text}
        </p>
      )}
    </div>
  );
}
