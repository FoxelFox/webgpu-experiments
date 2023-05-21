export async function init() {
	adapter = await navigator.gpu.requestAdapter();
	device = await adapter.requestDevice();
}

export let device: GPUDevice;
export let adapter: GPUAdapter;
