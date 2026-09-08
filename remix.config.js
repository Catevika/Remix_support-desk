/** @type {import('@remix-run/dev').AppConfig} */
module.exports = {
	// When running locally in development mode, we use the built in remix
	// server. This does not understand the vercel lambda module format,
	// so we default back to the standard build output.
	ignoredRouteFiles: ["**/.*"],
	// appDirectory: 'app',
	// assetsBuildDirectory: 'public/build',
	// serverBuildPath: 'api/index.js',
	// publicPath: '/build/'
	serverModuleFormat: "cjs",
	future: {
		v3_fetcherPersist: true,
		v3_lazyRouteDiscovery: true,
		v3_relativeSplatPath: true,
		v3_singleFetch: true,
		v3_throwAbortReason: true,
	},
};
