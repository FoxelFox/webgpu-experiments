export async function init() {
	adapter = await navigator.gpu.requestAdapter({powerPreference: "high-performance"});
	device = await adapter.requestDevice({
		requiredFeatures: [ 'float32-filterable' ]
	});
}

export let device: GPUDevice;
export let adapter: GPUAdapter;
