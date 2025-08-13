declare module "*.html" {
	const content: string;
	export default content;
}

declare module "*.scss" {
	const content: string;
	export default content;
}

// Declare needed GM APIs.
// Ref: https://www.tampermonkey.net/documentation.php?locale=en#api
declare function GM_addStyle(code: string): HTMLStyleElement;
declare function GM_getValue<T = unknown>(name: string, defaultValue?: T): T;
declare function GM_setValue<T = unknown>(name: string, value: T): void;
