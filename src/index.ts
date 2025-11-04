class App {
	constructor() {
		this.addThemeToggle();
	}

	private readonly themeStorageKey = "theme";

	private setTheme(theme: "dark" | "custom-winter") {
		try {
			localStorage.setItem(this.themeStorageKey, theme);
			document.documentElement.setAttribute("data-theme", theme);
			this.setupBridge();
			try {
				window.dispatchEvent(new CustomEvent("wplace:set-theme", { detail: theme }));
			} catch {}
		} catch {}
	}

	private setupBridge() {
		try {
			if (document.getElementById("wplace-theme-bridge")) return;
			const script = document.createElement("script");
			script.id = "wplace-theme-bridge";
			script.type = "text/javascript";
			script.textContent = `(() => {
				let setter = null;
				const toAbs = (u) => { try { return new URL(u, location.href).href } catch { return u } };
				async function findSetter() {
					if (setter) return setter;
					try {
						const urls = new Set(
							[...document.querySelectorAll('link[rel="modulepreload"]')].map(l => l.getAttribute('href')).concat(
								[...document.querySelectorAll('script[type="module"][src]')].map(s => s.getAttribute('src'))
							).filter(Boolean).map(toAbs)
						);
						for (const url of urls) {
							try {
								const mod = await import(url);
								for (const val of Object.values(mod)) {
									if (!val || typeof val !== 'object') continue;
									let proto = val;
									try { proto = Object.getPrototypeOf(val) || val } catch {}
									const desc = Object.getOwnPropertyDescriptor(proto, 'theme') || Object.getOwnPropertyDescriptor(val, 'theme');
									if (desc && typeof desc.set === 'function') {
										setter = (next) => { try { desc.set.call(val, next) } catch { try { val.theme = next } catch {} } };
										return setter;
									}
								}
							} catch {}
						}
					} catch {}
					return null;
				}
				async function handle(event) {
					const next = event.detail;
					try {
						const setter = await findSetter();
						setter && setter(next);
					} catch {}
				}
				window.addEventListener('wplace:set-theme', handle);
			})();`;
			document.documentElement.appendChild(script);
			script.remove();
		} catch {}
	}

	private getCurrentTheme(): "dark" | "custom-winter" {
		try {
			const theme = localStorage.getItem(this.themeStorageKey);
			return theme === "dark" ? "dark" : "custom-winter";
		} catch {
			return "custom-winter";
		}
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

		const isDark = () => this.getCurrentTheme() === "dark";
		const updateButton = (btn: HTMLButtonElement) => {
			const dark = isDark();
			btn.title = dark ? "Switch to light theme" : "Switch to dark theme";
			btn.setAttribute("aria-label", btn.title);
			btn.innerHTML = dark ? createIconSvg("sun") : createIconSvg("moon");
		};

		const findContainer = (): Element | null => {
			const container = document.querySelector(".absolute.left-2.top-2.z-30.flex.flex-col.gap-3");
			if (container) return container;
			return document.querySelector(
				'div[class*="left-2"][class*="top-2"][class*="flex"][class*="gap-3"]'
			);
		};

		const mount = () => {
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
						const next = dark ? "custom-winter" : "dark";
						this.setTheme(next);
						updateButton(btn);
					} catch {}
				};
				return true;
			} catch {
				return false;
			}
		};

		mount();

		let lastMount = 0;
		const observer = new MutationObserver(() => {
			try {
				const now = Date.now();
				if (now - lastMount < 300) return;
				lastMount = now;
				mount();
			} catch {}
		});
		try {
			observer.observe(document.body || document.documentElement, { subtree: true, childList: true });
		} catch {}
	}
}

new App();
