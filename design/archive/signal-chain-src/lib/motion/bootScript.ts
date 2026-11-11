/**
 * Server-safe half of the boot runtime (no "use client"): the storage keys and the source of the
 * inline <head> script, so the root layout (a Server Component) can render it.
 * The client half (bootMode, finishBoot) lives in ./boot.ts.
 */

export const BOOT_FAILSAFE_MS = 5200;
export const INTRO_SEEN_KEY = "pmp:intro-seen";
/** Set before a hard navigation from a datasheet to home: suppresses the intro once. */
export const FROM_SHEET_KEY = "pmp:from-sheet";

/**
 * Source of the inline <head> script. Keep it tiny and dependency-free: it runs before React.
 * Storage keys must match preferences.ts and the constants above.
 */
export function bootScript(basePath: string): string {
  return `(function(){var d=document.documentElement,c=d.classList,B=${JSON.stringify(basePath)};c.add("js");var m=null,s=null;try{m=localStorage.getItem("pmp:motion");s=localStorage.getItem("pmp:signals")}catch(e){}var rm=m?m==="reduced":matchMedia("(prefers-reduced-motion: reduce)").matches;if(rm)c.add("rm");if(s==="paused")c.add("signals-off");var p=location.pathname;if(B&&p.indexOf(B)===0)p=p.slice(B.length);var home=p===""||p==="/"||p==="/index.html",mode="none";if(home&&!rm&&!location.hash){var seen=false,back=false;try{seen=sessionStorage.getItem("${INTRO_SEEN_KEY}")==="1";sessionStorage.setItem("${INTRO_SEEN_KEY}","1");back=sessionStorage.getItem("${FROM_SHEET_KEY}")==="1";sessionStorage.removeItem("${FROM_SHEET_KEY}")}catch(e){}mode=back?"none":seen?"short":"full"}window.__pmpBoot=mode;if(mode!=="none"){c.add("booting");setTimeout(function(){if(c.contains("booting")){c.remove("booting");c.add("booted")}},${BOOT_FAILSAFE_MS})}else c.add("booted")})();`;
}
