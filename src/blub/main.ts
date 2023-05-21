import {device, init} from "../global";
import blubShader from "./blub.wgsl"
import {quad} from "../buffer/primitive";
import {createUniform, UniformBuffer} from "../buffer/uniform";
import {mat4} from "wgpu-matrix";

export class Blub {

	canvas: HTMLCanvasElement;
	context
	pipeline
	devicePixelRatio = window.devicePixelRatio || 1;

	uniform;
	uniformBindGroup

	constructor() {

	}

	setCanvasSize = () => {
		this.canvas.width = window.innerWidth * devicePixelRatio;
		this.canvas.height = window.innerHeight * devicePixelRatio;
		this.uniform.data.viewMatrix = mat4.ortho(0, this.canvas.width, 0, this.canvas.height, -1, 1);
	}

	async init() {
		
		await init();

		this.uniform = new UniformBuffer({
			viewMatrix: mat4.create(),
			blub: 23
		});

		this.canvas = document.getElementsByTagName("canvas")[0];
		this.setCanvasSize();
		window.addEventListener("resize", this.setCanvasSize);

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

		this.uniformBindGroup = device.createBindGroup({
			layout: this.pipeline.getBindGroupLayout(0),
			entries: [{
				binding: 0,
				resource: {buffer: un}
			}]
		})
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
		passEncoder.setVertexBuffer(0, quad(0.1));
		passEncoder.draw(6, 1, 0, 0);
		passEncoder.end();

		device.queue.submit([commandEncoder.finish()]);
		requestAnimationFrame(this.update);
	}
}

const blub = new Blub();
blub.init().then(() => blub.update());
