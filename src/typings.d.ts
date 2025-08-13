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
