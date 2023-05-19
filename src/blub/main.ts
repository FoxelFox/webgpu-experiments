import {device, init} from "../global";
import blubShader from "./blub.wgsl"
import {quad} from "../buffer/primitive";

export class Blub {

	canvas: HTMLCanvasElement;
	context
	pipeline
	devicePixelRatio = window.devicePixelRatio || 1;

	constructor() {
		this.canvas = document.getElementsByTagName("canvas")[0];
		this.setCanvasSize();
		window.addEventListener("resize", this.setCanvasSize);
	}

	setCanvasSize = () => {
		this.canvas.width = window.innerWidth * devicePixelRatio;
		this.canvas.height = window.innerHeight * devicePixelRatio;
	}

	async init() {
		
		await init();

		this.context = this.canvas.getContext('webgpu') as GPUCanvasContext;
		const presentationFormat = navigator.gpu.getPreferredCanvasFormat();

		this.context.configure({
			device: device,
			format: presentationFormat,
			alphaMode: 'premultiplied',
		});

		this.pipeline = device.createRenderPipeline({
			layout: 'auto',
			vertex: {

				module: device.createShaderModule({
					code: blubShader,
				}),
				entryPoint: 'vert_main',
				buffers: [{
					arrayStride: 2 * 4,
					attributes: [{
						shaderLocation: 0,
						format: "float32x2",
						offset: 0
					}]
				}]
			},
			fragment: {
				module: device.createShaderModule({
					code: blubShader,
				}),
				entryPoint: 'frag_main',
				targets: [
					{
						format: presentationFormat,
					},
				],
			},
			primitive: {
				topology: 'triangle-list'
			},
		});
	}



	update = () => {
		const commandEncoder = device.createCommandEncoder();
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
		passEncoder.setVertexBuffer(0, quad(1));
		passEncoder.draw(6, 1, 0, 0);
		passEncoder.end();

		device.queue.submit([commandEncoder.finish()]);
		requestAnimationFrame(this.update);
	}
}

const blub = new Blub();
blub.init().then(() => blub.update());
