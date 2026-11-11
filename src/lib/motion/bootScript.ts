/**
 * Server-safe half of the boot runtime (no "use client"): the storage keys and the source of the
 * inline <head> script, so the root layout (a Server Component) can render it.
 * The client half (bootMode, finishBoot) lives in ./boot.ts.
 */

/** The opening is <= 2.6s; if it has not called finishBoot() by now, reveal everything anyway. */
export const BOOT_FAILSAFE_MS = 4200;
/** sessionStorage: the opening already played in this tab session -> "short" next time. */
export const INTRO_SEEN_KEY = "pmp:intro-seen";
/** sessionStorage: set before a HARD navigation from a case study to home: suppresses the opening once. */
export const FROM_CASE_KEY = "pmp:from-case";
/** sessionStorage: sketch mode is on ("1") for this tab session (src/lib/stores/sketchMode.ts). Never on by default. */
export const SKETCH_KEY = "pmp:sketch";
/** localStorage: the About vault was left open ("open"; src/components/about/Vault.tsx). Locked by default. */
export const VAULT_KEY = "pmp:vault";
/** localStorage: the visitor's theme ("light" | "dark"); without it the OS setting decides. */
export const THEME_KEY = "pmp:theme";

/**
 * Source of the inline <head> script. Tiny and dependency-free: it runs before React.
 * It sets on <html>:
 *   js           always (JS is running)
 *   rm           reduced motion (the Motion toggle in localStorage "pmp:motion", else the OS)
 *   data-sketch  sketch mode was switched on earlier in this tab session (no opening then:
 *                the page already is the sketch)
 *   data-vault   "open": the About vault was left open (it is drawn open from the first paint;
 *                otherwise globals.css draws it locked until the component takes over)
 *   data-theme   "dark": dark mode (the visitor's choice, "pmp:theme", else the OS setting); light
 *                has no attribute (src/lib/stores/theme.ts)
 *   lite         a weak graphics card (or the visitor chose it): no JS smooth scroll, custom cursor or
 *                paper lens (src/lib/perf.ts); "pmp:lite" remembers it
 *   booting      the opening will play ("full" | "short"): [data-boot] elements start hidden
 *   booted       no opening, or the opening finished
 * and window.__pmpBoot = "full" | "short" | "none". The failsafe timer is window.__pmpBootT:
 * startBoot() re-arms it from the moment the opening really starts (slow hydration must not
 * reveal the hero halfway through its own opening).
 */
/**
 * Lite mode (src/lib/perf.ts): the graphics cards that lag on this site's per-frame effects. Old
 * NVIDIA GeForce GT / 8-9-series, old Intel HD Graphics (none, 2000-5500), old Radeon HD / R5 / R7,
 * old mobile GPUs, and software renderers. Checked once (a throwaway WebGL context), remembered.
 */
const LITE_RX = /swiftshader|llvmpipe|basic render|software|geforce gt \d{3}\b|geforce [2-9]\d{2,3}\b|quadro nvs|hd graphics(?: (?:[2-5][05]00|4[246]00))?(?! ?\d)|radeon(?:\(tm\))? (?:hd [2-8]|r[57] )|mali-[4t]|adreno \(tm\) [2-4]\d\d|powervr sgx/i;

export function bootScript(basePath: string): string {
  return `(function(){var d=document.documentElement,c=d.classList,B=${JSON.stringify(basePath)};c.add("js");var m=null;try{m=localStorage.getItem("pmp:motion")}catch(e){}var rm=m?m==="reduced":matchMedia("(prefers-reduced-motion: reduce)").matches;if(rm)c.add("rm");var sk=false;try{sk=sessionStorage.getItem("${SKETCH_KEY}")==="1"}catch(e){}if(sk)d.setAttribute("data-sketch","");try{if(localStorage.getItem("${VAULT_KEY}")==="open")d.setAttribute("data-vault","open")}catch(e){}try{var th=localStorage.getItem("${THEME_KEY}");if(th?th==="dark":matchMedia("(prefers-color-scheme: dark)").matches)d.setAttribute("data-theme","dark")}catch(e){}try{var L=localStorage.getItem("pmp:lite");if(L===null){var cv=document.createElement("canvas"),gl=cv.getContext("webgl")||cv.getContext("experimental-webgl"),r="";if(gl){var ex=gl.getExtension("WEBGL_debug_renderer_info");r=ex?String(gl.getParameter(ex.UNMASKED_RENDERER_WEBGL)):"";var lc=gl.getExtension("WEBGL_lose_context");if(lc)lc.loseContext()}L=!gl||${LITE_RX.toString()}.test(r)||(navigator.hardwareConcurrency||4)<=2?"1":"0";localStorage.setItem("pmp:lite",L)}if(L==="1")c.add("lite")}catch(e){}var p=location.pathname;if(B&&p.indexOf(B)===0)p=p.slice(B.length);var home=p===""||p==="/"||p==="/index.html",mode="none";if(home&&!rm&&!sk&&!location.hash){var seen=false,back=false;try{seen=sessionStorage.getItem("${INTRO_SEEN_KEY}")==="1";sessionStorage.setItem("${INTRO_SEEN_KEY}","1");back=sessionStorage.getItem("${FROM_CASE_KEY}")==="1";sessionStorage.removeItem("${FROM_CASE_KEY}")}catch(e){}mode=back?"none":seen?"short":"full"}window.__pmpBoot=mode;if(mode!=="none"){c.add("booting");window.__pmpBootT=setTimeout(function(){if(c.contains("booting")){c.remove("booting");c.add("booted")}},${BOOT_FAILSAFE_MS})}else c.add("booted")})();`;
}
