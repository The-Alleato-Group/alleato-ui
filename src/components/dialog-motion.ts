export const dialogOverlayMotion =
  "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:duration-150 data-[state=closed]:duration-100 data-[state=open]:ease-out data-[state=closed]:ease-in";

// Dialogs fade in place. No zoom, no drift (owner decision 2026-09-16: the
// zoom-in read as dated). slide-in-from-left-1/2 / slide-in-from-top-1/2 seed
// the @keyframes enter "from" state at translate(-50%,-50%) — exactly the
// centered position — so only opacity animates. Without these seeds
// tailwindcss-animate starts the "from" frame at translate(0,0), overriding
// translate-x-[-50%] translate-y-[-50%] and flashing the dialog off-screen.
export const dialogContentMotion =
  "data-[state=open]:animate-in data-[state=closed]:animate-out " +
  "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 " +
  "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-1/2 " +
  "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-1/2 " +
  "data-[state=open]:duration-200 data-[state=closed]:duration-150 " +
  "data-[state=open]:ease-out data-[state=closed]:ease-in";
