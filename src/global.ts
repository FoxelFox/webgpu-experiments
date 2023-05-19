export async function init() {
	adapter = await navigator.gpu.requestAdapter();
	device = await adapter.requestDevice();
}

export let device;
export let adapter;
