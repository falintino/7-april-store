"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export default function AdminHorizontalScroll({
  children,
}: {
  children: React.ReactNode;
}) {
  const topRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const [contentWidth, setContentWidth] = useState(2100);

  useEffect(() => {
    const table = tableRef.current;
    if (!table) return;

    const updateWidth = () => {
      setContentWidth(table.scrollWidth);
    };

    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(table);
    if (table.firstElementChild) observer.observe(table.firstElementChild);

    return () => observer.disconnect();
  }, []);

  const syncFromTop = useCallback(() => {
    const top = topRef.current;
    const table = tableRef.current;
    if (top && table && table.scrollLeft !== top.scrollLeft) {
      table.scrollLeft = top.scrollLeft;
    }
  }, []);

  const syncFromTable = useCallback(() => {
    const top = topRef.current;
    const table = tableRef.current;
    if (top && table && top.scrollLeft !== table.scrollLeft) {
      top.scrollLeft = table.scrollLeft;
    }
  }, []);

  return (
    <div>
      <div
        ref={topRef}
        onScroll={syncFromTop}
        aria-label="Geser tabel transaksi secara horizontal"
        className="sticky top-[72px] z-30 overflow-x-auto overflow-y-hidden border-y border-white/10 bg-slate-950/95 shadow-lg backdrop-blur"
        style={{ height: 14 }}
      >
        <div style={{ width: contentWidth, height: 1 }} />
      </div>
      <div
        ref={tableRef}
        onScroll={syncFromTable}
        className="overflow-x-auto"
      >
        {children}
      </div>
    </div>
  );
}
