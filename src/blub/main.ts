import {device, init} from "../global";
import blubShader from "./blub.wgsl";
import updateShader from "./update.wgsl";
import {quad} from "../buffer/primitive";
import {createUniform, UniformBuffer} from "../buffer/uniform";
import {mat4, vec4} from "wgpu-matrix";

export class Blub {

	canvas: HTMLCanvasElement;
	context
	pipeline
	computePipeline
	numParticles = 3000;
	t = 0;

	uniform: UniformBuffer;
	renderUniformBindGroup
	computeUniformBindGroup
	particleBindGroups: GPUBindGroup[]
	particleBuffers: GPUBuffer[]


	constructor() {

	}

	setCanvasSize = () => {
		this.canvas.width = window.innerWidth * devicePixelRatio;
		this.canvas.height = window.innerHeight * devicePixelRatio;

		const ar = this.canvas.width / this.canvas.height;

		this.uniform.data.viewMatrix = mat4.ortho(-ar, ar, -1, 1, -1, 1);
	}

	setMousePosition = (event) => {
		// x und y position der maus im Fenster
		let mouseX = event.clientX;
		let mouseY = event.clientY;

		// normalisierte Werte (-1 bis 1)
		let normalizedX = (mouseX / window.innerWidth) * 2 - 1;
		let normalizedY = -((mouseY / window.innerHeight) * 2 - 1);

		// Bei unterschiedlichen Seitenverhältnissen
		let aspectRatio = window.innerWidth / window.innerHeight;
		normalizedX *= aspectRatio;

		this.uniform.data.blub[0] = normalizedX;
		this.uniform.data.blub[1] = normalizedY;
	}

	async init() {
		
		await init();

		this.uniform = new UniformBuffer({
			viewMatrix: mat4.create(),
			blub: vec4.create()
		});

		this.canvas = document.getElementsByTagName("canvas")[0];
		this.setCanvasSize();
		window.addEventListener("resize", this.setCanvasSize);
		window.addEventListener("mousemove", this.setMousePosition);

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
				}, {
					arrayStride: 2 * 4,
					stepMode: 'instance',
					attributes: [{
						// instance position
						shaderLocation: 1,
						offset: 0,
						format: 'float32x2',
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

		this.computePipeline = device.createComputePipeline({
			layout: 'auto',
			compute: {
				module: device.createShaderModule({
					code: updateShader,
				}),
				entryPoint: 'main',
			}
		});


		const initialParticleData = new Float32Array(this.numParticles * 2);
		for (let i = 0; i < this.numParticles; ++i) {
			initialParticleData[2 * i + 0] = 2 * (Math.random() - 0.5);
			initialParticleData[2 * i + 1] = 2 * (Math.random() - 0.5);
		}

		this.particleBuffers = new Array(2);
		this.particleBindGroups = new Array(2);
		for (let i = 0; i < 2; ++i) {
			this.particleBuffers[i] = device.createBuffer({
				size: initialParticleData.byteLength,
				usage: GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE,
				mappedAtCreation: true,
			});
			new Float32Array(this.particleBuffers[i].getMappedRange()).set(
				initialParticleData
			);
			this.particleBuffers[i].unmap();
		}

		for (let i = 0; i < 2; ++i) {
			this.particleBindGroups[i] = device.createBindGroup({
				layout: this.computePipeline.getBindGroupLayout(0),
				entries: [
					{
						binding: 0,
						resource: {
							buffer: this.particleBuffers[i],
							offset: 0,
							size: initialParticleData.byteLength,
						},
					},
					{
						binding: 1,
						resource: {
							buffer: this.particleBuffers[(i + 1) % 2],
							offset: 0,
							size: initialParticleData.byteLength,
						},
					},
					{
						binding: 2,
						resource: {
							buffer: this.uniform.buffer
						}
					}
				],
			});
		}

		this.renderUniformBindGroup = device.createBindGroup({
			layout: this.pipeline.getBindGroupLayout(0),
			entries: [{
				binding: 0,
				resource: {buffer: this.uniform.buffer}
			}]
		})
	}



	update = () => {
		this.uniform.update();
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

		{
			const passEncoder = commandEncoder.beginComputePass();
			passEncoder.setPipeline(this.computePipeline);
			passEncoder.setBindGroup(0, this.particleBindGroups[this.t % 2]);
			passEncoder.dispatchWorkgroups(Math.ceil(this.numParticles / 64));
			passEncoder.end();
		}

		{
			const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
			passEncoder.setPipeline(this.pipeline);
			passEncoder.setBindGroup(0, this.renderUniformBindGroup);
			passEncoder.setVertexBuffer(0, quad(0.01));
			passEncoder.setVertexBuffer(1, this.particleBuffers[(this.t + 1) % 2]);
			passEncoder.draw(6, this.numParticles, 0, 0);
			passEncoder.end();
		}

		++this.t;
		device.queue.submit([commandEncoder.finish()]);
		requestAnimationFrame(this.update);
	}
}

const blub = new Blub();
blub.init().then(() => blub.update());
