import STYLES from "./scss/style.scss";

class App {
	constructor() {
		this.applyStyles();
		this.applyThemeTokens();
		this.addThemeToggle();
		this.initOverlayCustomization();
		this.addOverlaySliderControl();
	}
	private applyStyles() {
		GM_addStyle(STYLES);
	}

	private addOverlaySliderControl() {
		const STORAGE_KEY = "wplace.overlayOpacity";
		const DEFAULT_OPACITY = 0.28;
		const isDarkMode = () => document.documentElement.getAttribute("data-theme") === "dark";

		const findContainer = (): Element | null => {
			let el = document.querySelector(".absolute.left-2.top-2.z-30.flex.flex-col.gap-3");
			if (el) return el;
			el = document.querySelector(
				'div[class*="left-2"][class*="top-2"][class*="flex"][class*="gap-3"]'
			);
			return el;
		};

		const ensureMounted = () => {
			try {
				const container = findContainer();
				if (!container) return false;
				let wrap = document.getElementById("wplace-overlay-ui");
				if (!wrap) {
					wrap = document.createElement("div");
					wrap.id = "wplace-overlay-ui";
					wrap.style.position = "relative";
					container.prepend(wrap);
				}

				const themeBtn = document.getElementById("wplace-theme-toggle") as HTMLButtonElement | null;
				if (!themeBtn) return false;

				let panel = document.getElementById("wplace-overlay-panel");
				if (!panel) {
					panel = document.createElement("div");
					panel.id = "wplace-overlay-panel";
					panel.style.position = "fixed";
					panel.style.left = "0";
					panel.style.top = "0";
					panel.style.zIndex = "9999";
					panel.style.background = "var(--color-base-200)";
					panel.style.color = "var(--color-base-content)";
					panel.style.border = "1px solid color-mix(in oklab, var(--color-base-300), black 10%)";
					panel.style.boxShadow = "0 8px 30px rgba(0,0,0,.45)";
					panel.style.padding = "8px 10px";
					panel.style.borderRadius = "10px";
					panel.style.display = "none";
					panel.style.width = "220px";
					panel.innerHTML = `
						<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
							<strong style="font-size:12px">Map dimming</strong>
							<span id="wplace-overlay-value" style="margin-left:auto;font-size:12px">-</span>
						</div>
						<input id="wplace-overlay-range" type="range" min="0" max="90" step="1" style="width:100%" aria-label="Map dimming" title="Map dimming (0–90%)" />
						<div style="display:flex;justify-content:flex-end;margin-top:8px">
							<button id="wplace-overlay-reset" class="btn btn-xs" style="font-size:12px">Reset</button>
						</div>
					`;
					document.body.append(panel);
				}

				const valueEl = document.getElementById("wplace-overlay-value") as HTMLElement;
				const rangeEl = document.getElementById("wplace-overlay-range") as HTMLInputElement;
				const resetEl = document.getElementById("wplace-overlay-reset") as HTMLButtonElement;

				const getOpacity = (): number => {
					const s = getComputedStyle(document.documentElement)
						.getPropertyValue("--wplace-overlay-opacity")
						.trim();
					const n = parseFloat(s);
					return Number.isFinite(n) ? n : DEFAULT_OPACITY;
				};

				const setOpacity = (n: number) => {
					const clamped = Math.max(0, Math.min(0.9, n));
					document.documentElement.style.setProperty("--wplace-overlay-opacity", String(clamped));
					try {
						GM_setValue?.(STORAGE_KEY, clamped);
					} catch {}
					if (valueEl) valueEl.textContent = `${Math.round(clamped * 100)}%`;
					if (rangeEl) rangeEl.value = String(Math.round(clamped * 100));
				};

				const initial = (() => {
					try {
						return (GM_getValue?.(STORAGE_KEY, getOpacity()) as number) ?? DEFAULT_OPACITY;
					} catch {
						return getOpacity();
					}
				})();
				setOpacity(initial);

				const positionPanel = () => {
					if (!panel || !themeBtn) return;
					const r = themeBtn.getBoundingClientRect();
					panel.style.left = `${Math.round(r.right + 8)}px`;
					panel.style.top = `${Math.round(r.top)}px`;
				};
				positionPanel();
				window.addEventListener("scroll", positionPanel, true);
				window.addEventListener("resize", positionPanel);

				let hideTimer: number | null = null;
				const showPanel = () => {
					if (!isDarkMode()) return;
					if (!panel) return;
					if (hideTimer) {
						clearTimeout(hideTimer);
						hideTimer = null;
					}
					positionPanel();
					panel.style.display = "block";
					panel.classList.remove("wplace-visible");
					requestAnimationFrame(() => {
						void (panel as HTMLDivElement).offsetWidth;
						(panel as HTMLDivElement).classList.add("wplace-visible");
					});
				};
				const scheduleHide = () => {
					if (!panel) return;
					if (hideTimer) clearTimeout(hideTimer);
					hideTimer = setTimeout(() => {
						(panel as HTMLDivElement).classList.remove("wplace-visible");
						setTimeout(() => {
							(panel as HTMLDivElement).style.display = "none";
						}, 160);
					}, 120) as unknown as number;
				};

				themeBtn.addEventListener("mouseenter", showPanel);
				themeBtn.addEventListener("mouseleave", scheduleHide);
				panel.addEventListener("mouseenter", () => {
					if (hideTimer) {
						clearTimeout(hideTimer);
						hideTimer = null;
					}
				});
				panel.addEventListener("mouseleave", scheduleHide);
				rangeEl.oninput = () => {
					const pct = parseFloat(rangeEl.value);
					if (!Number.isFinite(pct)) return;
					setOpacity(pct / 100);
				};
				if (resetEl)
					resetEl.onclick = () => {
						setOpacity(DEFAULT_OPACITY);
					};

				return true;
			} catch {
				return false;
			}
		};

		ensureMounted();
		let lastEnsure = 0;
		const obs = new MutationObserver(() => {
			const now = Date.now();
			if (now - lastEnsure < 300) return;
			lastEnsure = now;
			ensureMounted();
		});
		try {
			obs.observe(document.body || document.documentElement, { subtree: true, childList: true });
		} catch {}
	}
	private applyThemeTokens() {
		try {
			document.documentElement.setAttribute("data-theme", "dark");
			document.body.style.backgroundColor = "var(--color-base-100)";
			document.body.style.color = "var(--color-base-content)";
		} catch {}
	}

	private addThemeToggle() {
		const createIconSvg = (type: "sun" | "moon") => {
			if (type === "sun") {
				return (
					`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="currentColor" class="size-3.5">` +
					`<path d="M480-360q50 0 85-35t35-85q0-50-35-85t-85-35q-50 0-85 35t-35 85q0 50 35 85t85 35Zm0 80q-83 0-141.5-58.5T280-480q0-83 58.5-141.5T480-680q83 0 141.5 58.5T680-480q0 83-58.5 141.5T480-280ZM200-440H40v-80h160v80Zm720 0H760v-80h160v80ZM440-760v-160h80v160h-80Zm0 720v-160h80v160h-80ZM256-650l-101-97 57-59 96 100-52 56Zm492 496-97-101 53-55 101 97-57 59Zm-98-550 97-101 59 57-100 96-56-52ZM154-212l101-97 55 53-97 101-59-57Zm326-268Z"/>` +
					`</svg>`
				);
			}
			return (
				`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="currentColor" class="size-3.5">` +
				`<path d="M480-120q-150 0-255-105T120-480q0-150 105-255t255-105q14 0 27.5 1t26.5 3q-41 29-65.5 75.5T444-660q0 90 63 153t153 63q55 0 101-24.5t75-65.5q2 13 3 26.5t1 27.5q0 150-105 255T480-120Zm0-80q88 0 158-48.5T740-375q-20 5-40 8t-40 3q-123 0-209.5-86.5T364-660q0-20 3-40t8-40q-78 32-126.5 102T200-480q0 116 82 198t198 82Zm-10-270Z"/>` +
				`</svg>`
			);
		};

		const isDark = () => document.documentElement.getAttribute("data-theme") === "dark";
		const updateButton = (btn: HTMLButtonElement) => {
			const dark = isDark();
			btn.title = dark ? "Switch to light theme" : "Switch to dark theme";
			btn.setAttribute("aria-label", btn.title);
			btn.innerHTML = dark ? createIconSvg("sun") : createIconSvg("moon");
		};

		const findContainer = (): Element | null => {
			let el = document.querySelector(".absolute.left-2.top-2.z-30.flex.flex-col.gap-3");
			if (el) return el;
			const refreshBtn = document.querySelector('button[title="Refresh"]');
			if (refreshBtn) {
				let n: HTMLElement | null = refreshBtn as HTMLElement;
				for (let i = 0; n && i < 5; i++) {
					n = n.parentElement;
					if (
						n &&
						n.classList.contains("absolute") &&
						n.classList.contains("left-2") &&
						n.classList.contains("top-2")
					) {
						return n;
					}
				}
			}
			const liveLink = document.querySelector('a[title="Livestreams"]');
			if (liveLink) {
				let n: HTMLElement | null = liveLink as HTMLElement;
				for (let i = 0; n && i < 5; i++) {
					n = n.parentElement;
					if (
						n &&
						n.classList.contains("absolute") &&
						n.classList.contains("left-2") &&
						n.classList.contains("top-2")
					) {
						return n;
					}
				}
			}
			el = document.querySelector(
				'div[class*="left-2"][class*="top-2"][class*="flex"][class*="gap-3"]'
			);
			return el;
		};

		const ensureMounted = () => {
			try {
				const container = findContainer();
				if (!container) return false;
				let btn = document.getElementById("wplace-theme-toggle") as HTMLButtonElement | null;
				if (!btn) {
					btn = document.createElement("button");
					btn.id = "wplace-theme-toggle";
					btn.className = "btn btn-sm btn-circle";
					container.prepend(btn);
				}
				updateButton(btn);
				btn.onclick = () => {
					try {
						const dark = isDark();
						document.documentElement.setAttribute("data-theme", dark ? "light" : "dark");
						document.body.style.backgroundColor = dark ? "" : "var(--color-base-100)";
						document.body.style.color = dark ? "" : "var(--color-base-content)";
						updateButton(btn);
					} catch {}
				};
				return true;
			} catch {
				return false;
			}
		};

		ensureMounted();
		let lastEnsure = 0;
		const obs = new MutationObserver(() => {
			try {
				const now = Date.now();
				if (now - lastEnsure < 300) return;
				lastEnsure = now;
				ensureMounted();
			} catch {}
		});
		try {
			obs.observe(document.body || document.documentElement, { subtree: true, childList: true });
		} catch {}

		const iv = setInterval(() => {
			try {
				ensureMounted();
			} catch {}
		}, 1500);
		setTimeout(() => clearInterval(iv), 60000);
	}

	private initOverlayCustomization() {
		const STORAGE_KEY = "wplace.overlayOpacity";
		const DEFAULT_OPACITY = 0.28;

		const applyOpacity = (value: number) => {
			try {
				const clamped = Math.max(0, Math.min(0.9, value));
				document.documentElement.style.setProperty("--wplace-overlay-opacity", String(clamped));
			} catch {}
		};

		try {
			const stored = (GM_getValue?.(STORAGE_KEY, DEFAULT_OPACITY) ?? DEFAULT_OPACITY) as number;
			applyOpacity(Number(stored) || DEFAULT_OPACITY);
		} catch {
			applyOpacity(DEFAULT_OPACITY);
		}

		const parseInput = (input: string): number | null => {
			let s = input.trim();
			if (!s) return null;
			if (s.endsWith("%")) {
				const n = parseFloat(s.slice(0, -1));
				if (Number.isNaN(n)) return null;
				return n / 100;
			}
			const n = parseFloat(s);
			if (Number.isNaN(n)) return null;
			return n > 1 ? n / 100 : n;
		};

		const openPrompt = () => {
			try {
				const current = parseFloat(
					getComputedStyle(document.documentElement)
						.getPropertyValue("--wplace-overlay-opacity")
						.trim()
				);
				const suggestion = Number.isFinite(current) ? current : DEFAULT_OPACITY;
				const answer = window.prompt(
					"Map dark overlay intensity (0-1 or percent, e.g. 0.28 or 28%)",
					String(suggestion)
				);
				if (answer == null) return;
				const parsed = parseInput(answer);
				if (parsed == null) return;
				const clamped = Math.max(0, Math.min(0.9, parsed));
				try {
					GM_setValue?.(STORAGE_KEY, clamped);
				} catch {}
				applyOpacity(clamped);
			} catch {}
		};
	}
}

new App();
