import fragmentShader from "./blub.frag.wgsl"
import vertexShader from "./blub.vert.wgsl"

export class Blub {

	canvas: HTMLCanvasElement;
	device
	context
	pipeline
	devicePixelRatio = window.devicePixelRatio || 1;

	constructor() {
		this.canvas = document.getElementsByTagName("canvas")[0];
		this.setCanvasSize();
		window.addEventListener("resize", this.setCanvasSize);
	}

	setCanvasSize = () => {
		this.canvas.width = window.innerWidth * this.devicePixelRatio;
		this.canvas.height = window.innerHeight * this.devicePixelRatio;
	}

	async init() {
		const adapter = await navigator.gpu.requestAdapter();
		this.device = await adapter.requestDevice();

		this.context = this.canvas.getContext('webgpu') as GPUCanvasContext;
		const presentationFormat = navigator.gpu.getPreferredCanvasFormat();

		this.context.configure({
			device: this.device,
			format: presentationFormat,
			alphaMode: 'premultiplied',
		});

		this.pipeline = this.device.createRenderPipeline({
			layout: 'auto',
			vertex: {

				module: this.device.createShaderModule({
					code: vertexShader,
				}),
				entryPoint: 'main',
			},
			fragment: {
				module: this.device.createShaderModule({
					code: fragmentShader,
				}),
				entryPoint: 'main',
				targets: [
					{
						format: presentationFormat,
					},
				],
			},
			primitive: {
				topology: 'triangle-list',
			},
		});
	}



	update = () => {
		const commandEncoder = this.device.createCommandEncoder();
		const textureView = this.context.getCurrentTexture().createView();

		const renderPassDescriptor: GPURenderPassDescriptor = {
			colorAttachments: [
				{
					view: textureView,
					clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
					loadOp: 'clear',
					storeOp: 'store',

				},
			],
		};

		const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
		passEncoder.setPipeline(this.pipeline);
		passEncoder.draw(3, 1, 0, 0);
		passEncoder.end();

		this.device.queue.submit([commandEncoder.finish()]);
		requestAnimationFrame(this.update);
	}
}

const blub = new Blub();
blub.init().then(() => blub.update());
