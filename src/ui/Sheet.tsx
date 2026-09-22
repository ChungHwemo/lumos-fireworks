import { useState, type ReactNode } from "react";
import { useLang } from "./Lang.tsx";

/**
 * 지도 위 정보 시트. 모바일은 아래에서 올라오는 바텀시트고 손잡이로 접고 펼친다.
 * 880px 이상에서는 오른쪽 패널이 되고 손잡이는 CSS 가 숨긴다.
 */
export function Sheet({
  children,
  as = "section",
  ariaLabel,
}: {
  children: ReactNode;
  as?: "section" | "article";
  ariaLabel?: string;
}) {
  const { t } = useLang();
  const [expanded, setExpanded] = useState(false);
  const Tag = as;
  return (
    <Tag className={`sheet${expanded ? " is-expanded" : ""}`} aria-label={ariaLabel}>
      <button
        type="button"
        className="sheet-handle"
        aria-expanded={expanded}
        aria-label={expanded ? t.collapseSheet : t.expandSheet}
        onClick={() => setExpanded((on) => !on)}
      >
        <span />
      </button>
      <div className="sheet-body">{children}</div>
    </Tag>
  );
}
