import { useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, ChevronUp, ChevronDown, Keyboard } from "lucide-react";

interface DetailNavigationProps {
  backLabel: string;
  backPath: string;
  currentId: string;
  allIds: string[];
  buildPath: (id: string) => string;
  tabParam?: string;
}

export function DetailNavigation({
  backLabel,
  backPath,
  currentId,
  allIds,
  buildPath,
  tabParam,
}: DetailNavigationProps) {
  const navigate = useNavigate();
  const currentIndex = allIds.indexOf(currentId);
  const total = allIds.length;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < total - 1;

  const goBack = useCallback(() => navigate(backPath), [navigate, backPath]);

  const goPrev = useCallback(() => {
    if (hasPrev) {
      const prevPath = buildPath(allIds[currentIndex - 1]);
      navigate(tabParam ? `${prevPath}?tab=${tabParam}` : prevPath);
      window.scrollTo(0, 0);
    }
  }, [hasPrev, allIds, currentIndex, navigate, buildPath, tabParam]);

  const goNext = useCallback(() => {
    if (hasNext) {
      const nextPath = buildPath(allIds[currentIndex + 1]);
      navigate(tabParam ? `${nextPath}?tab=${tabParam}` : nextPath);
      window.scrollTo(0, 0);
    }
  }, [hasNext, allIds, currentIndex, navigate, buildPath, tabParam]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "j" || e.key === "ArrowRight") { e.preventDefault(); goNext(); }
      if (e.key === "k" || e.key === "ArrowLeft") { e.preventDefault(); goPrev(); }
      if (e.key === "Escape") { e.preventDefault(); goBack(); }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goBack, goPrev, goNext]);

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={goBack}
        className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors -ml-1 cursor-pointer"
        style={{ fontWeight: 450 }}
      >
        <ArrowLeft className="w-4 h-4" />
        {backLabel}
      </button>

      {total > 1 && (
        <>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-1">
            <button
              onClick={goPrev}
              disabled={!hasPrev}
              title="Vorheriger (k / ←)"
              className="p-1 rounded-md hover:bg-secondary transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            </button>
            <span className="text-[11px] text-muted-foreground tabular-nums px-1" style={{ fontWeight: 500 }}>
              {currentIndex + 1} / {total}
            </span>
            <button
              onClick={goNext}
              disabled={!hasNext}
              title="Nächster (j / →)"
              className="p-1 rounded-md hover:bg-secondary transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </button>
            <div className="hidden md:block ml-1" title="j/k oder ←/→ zum Blättern, Esc zurück">
              <Keyboard className="w-3.5 h-3.5 text-muted-foreground/40" />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
