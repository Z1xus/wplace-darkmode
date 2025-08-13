import STYLES from "./scss/style.scss";

class App {
	constructor() {
		this.applyStyles();
		this.applyThemeTokens();
		this.addThemeToggle();
	}
	private applyStyles() {
		GM_addStyle(STYLES);
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
}

new App();
