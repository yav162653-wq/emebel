import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export function CustomCursor() {
  const [visible, setVisible] = useState(false);
  const [label, setLabel] = useState("");
  const [isPointer, setIsPointer] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  const springConfig = { stiffness: 350, damping: 28, mass: 0.5 };
  const ringSpringConfig = { stiffness: 120, damping: 18, mass: 0.8 };

  const dotX = useSpring(mouseX, springConfig);
  const dotY = useSpring(mouseY, springConfig);
  const ringX = useSpring(mouseX, ringSpringConfig);
  const ringY = useSpring(mouseY, ringSpringConfig);

  useEffect(() => {
    // Only on non-touch devices
    if (window.matchMedia("(pointer: coarse)").matches) return;

    document.body.style.cursor = "none";

    const onMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      setVisible(true);

      const target = e.target as HTMLElement;
      const closest = target.closest("a, button, [role=button], input, textarea, select, label, [data-cursor]");
      const cursorLabel = (closest as HTMLElement)?.dataset?.cursor || "";
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA";

      setLabel(cursorLabel);
      setIsPointer(!!closest && !isInput);
      setIsHidden(isInput);
    };

    const onLeave = () => setVisible(false);
    const onEnter = () => setVisible(true);

    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);

    return () => {
      document.body.style.cursor = "";
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
    };
  }, [mouseX, mouseY]);

  if (typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches) {
    return null;
  }

  return (
    <>
      {/* Dot */}
      <motion.div
        style={{ x: dotX, y: dotY }}
        className="fixed top-0 left-0 z-[99999] pointer-events-none"
        animate={{
          opacity: visible && !isHidden ? 1 : 0,
          scale: isPointer ? 0 : 1,
        }}
        transition={{ duration: 0.15 }}
      >
        <div className="w-2 h-2 rounded-full bg-foreground -translate-x-1/2 -translate-y-1/2 mix-blend-difference" />
      </motion.div>

      {/* Ring */}
      <motion.div
        style={{ x: ringX, y: ringY }}
        className="fixed top-0 left-0 z-[99998] pointer-events-none"
        animate={{
          opacity: visible && !isHidden ? 1 : 0,
          scale: isPointer ? 1.6 : label ? 2.5 : 1,
          width: label ? 72 : 32,
          height: label ? 72 : 32,
        }}
        transition={{ duration: 0.2 }}
      >
        <div className={`rounded-full border border-foreground/60 -translate-x-1/2 -translate-y-1/2 w-full h-full flex items-center justify-center mix-blend-difference ${label ? "bg-foreground" : "bg-transparent"}`}>
          {label && (
            <span className="text-background text-[9px] font-bold uppercase tracking-widest whitespace-nowrap">
              {label}
            </span>
          )}
        </div>
      </motion.div>
    </>
  );
}
