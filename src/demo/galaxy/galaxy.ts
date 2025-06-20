import {device} from "../../global";
import drawParticles from "./draw-particles.wgsl";
import updateParticles from "./update-particles.wgsl";
import {quad} from "../../data/primitive";
import {UniformBuffer} from "../../data/uniform";
import {mat4, vec4} from "wgpu-matrix";
import p5 from 'p5';
import {Grid} from "./grid/grid";

export class Galaxy {

	canvas: HTMLCanvasElement;
	context
	pipeline
	computePipeline
	numParticles = 1024*64;
	t = 0;

	uniform: UniformBuffer;
	renderUniformBindGroup
	particleBindGroups: GPUBindGroup[]
	particleBuffers: GPUBuffer[]
	grid: Grid
	quad: GPUBuffer

	difficulty: number = 1;


	constructor() {

	}

	setCanvasSize = () => {
		this.canvas.width = window.innerWidth * devicePixelRatio;
		this.canvas.height = window.innerHeight * devicePixelRatio;

		const ar = this.canvas.width / this.canvas.height;

		this.uniform.data.viewMatrix = mat4.ortho(-ar, ar, -1, 1, -1, 1);
	}

	setMousePosition = (event) => {

		let mouseX = event.clientX;
		let mouseY = event.clientY;

		let normalizedX = (mouseX / window.innerWidth) * 2 - 1;
		let normalizedY = -((mouseY / window.innerHeight) * 2 - 1);

		let aspectRatio = window.innerWidth / window.innerHeight;
		normalizedX *= aspectRatio;

		this.uniform.data.blub[0] = normalizedX;
		this.uniform.data.blub[1] = normalizedY;
	}

	onmousedown = () => {
		this.uniform.data.blub[3] = this.uniform.data.blub[3] ? 0 : 1;
		console.log(this.uniform.data.blub[3])
	}



	// THX ChatGPT
	calculateInitialVelocity(x: number, y: number, angularVelocity: number, noise: p5): { x: number, y: number } {
		const noiseScale = 10;

		angularVelocity += (noise.noise(x * noiseScale, y * noiseScale) - 0.5) * 2 * 0.005;
		// Berechne den Abstand zum Zentrum der Galaxie
		const r = Math.sqrt(x * x + y * y);

		// Berechne die Richtung der Geschwindigkeit, die senkrecht zur Verbindungslinie zum Zentrum stehen soll
		const theta = Math.atan2(y, x) + Math.PI / 2;

		// Setze die Geschwindigkeit und gebe sie als ein 2D-Vector zurück
		const vx = angularVelocity * (r) * Math.cos(theta)
		const vy = angularVelocity * (r) * Math.sin(theta)

		return {x: vx, y: vy};
		//return {x: 0, y: 0};
	}

	// THX ChatGPT
	generateRandomParticle(radius: number, noise: p5): { x: number, y: number } {
		// Wähle den Radius und den Winkel zufällig aus
		const r = Math.sqrt(Math.random()) * radius;
		const theta = Math.random() * 2 * Math.PI;

		// Berechne die kartesischen Koordinaten
		const x = r * Math.cos(theta);
		const y = r * Math.sin(theta);

		return {x, y};
	}

	async start() {
		this.init();

		this.setDifficulty(1);
		await this.update();


		let difficulty = 1;
		let difficultyIncrease = 1;
		let before = Date.now();
		let fps = 60;
		let score = 0;


		const loop = async () => {

			await device.queue.onSubmittedWorkDone();
			await this.update();

			const now = Date.now();
			const time = now - before;
			before = now;

			fps = 1000 / time;

			if (fps > 60 && difficulty < 200 && this.uniform.data.blub[3] === 0) {
				difficulty += difficultyIncrease;
				this.setDifficulty(difficulty);
				score = 0;

				if (difficulty == 100) {
					difficultyIncrease = 1;
				}

			}

			if (this.uniform.data.blub[3] === 0) {
				score = (score * 24 + Math.pow((difficulty / 100) * fps, 2)) /25;
			}

			//document.getElementById("info").innerHTML = `Your GPU can handle ${difficulty * 1024} Particles when targeting 60 FPS`
			document.getElementById("score").innerHTML = `Benchmark Score ${score.toFixed(0)}`

			requestAnimationFrame(loop);
		}

		await loop();
	}

	init() {

		document.body.innerHTML =`
<div id="score" style="color: white"></div>
<canvas></canvas>
`;

		this.quad = quad(0.005);

		this.uniform = new UniformBuffer({
			viewMatrix: mat4.create(),
			blub: vec4.create()
		});

		this.canvas = document.getElementsByTagName("canvas")[0];
		this.setCanvasSize();
		window.addEventListener("resize", this.setCanvasSize);
		window.addEventListener("mousemove", this.setMousePosition);
		window.addEventListener("mousedown", this.onmousedown);

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
					code: drawParticles,
				}),
				entryPoint: 'vert_main',
				buffers: [{
					arrayStride: 2 * 4,
					attributes: [{
						shaderLocation: 0,
						format: "float32x2",
						offset: 0
					}, ]
				}, {
					arrayStride: 6 * 4,
					stepMode: 'instance',
					attributes: [{
						// instance position
						shaderLocation: 3,
						offset: 0,
						format: 'float32x2',
					}, {
						// instance velocity
						shaderLocation: 1,
						format: "float32x2",
						offset: 2 * 4
					}, {
						// instance force
						shaderLocation: 2,
						format: "float32x2",
						offset: 4 * 4
					}]
				}]
			},
			fragment: {
				module: device.createShaderModule({
					code: drawParticles,
				}),
				entryPoint: 'frag_main',
				targets: [
					{
						format: presentationFormat,
						blend: {
							color: {
								srcFactor: 'src-alpha',
								dstFactor: 'one',
								operation: 'add',
							},
							alpha: {
								srcFactor: 'zero',
								dstFactor: 'one',
								operation: 'add',
							},
						},
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
					code: updateParticles,
				}),
				entryPoint: 'main',
			}
		});


		this.setDifficulty(1);


		this.renderUniformBindGroup = device.createBindGroup({
			layout: this.pipeline.getBindGroupLayout(0),
			entries: [{
				binding: 0,
				resource: {buffer: this.uniform.buffer}
			}]
		});
	}



	update = async () => {
		this.uniform.data.blub[2] = this.difficulty;
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

		//if (this.t % 120 == 0) {
			//this.grid.run(commandEncoder, this.t);
		//}

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
			passEncoder.setVertexBuffer(0, this.quad);
			passEncoder.setVertexBuffer(1, this.activeParticleBuffer);
			passEncoder.draw(6, this.numParticles, 0, 0);
			passEncoder.end();
		}

		++this.t;
		device.queue.submit([commandEncoder.finish()]);
		// await device.queue.onSubmittedWorkDone();
		// await this.grid.readFromGPU();
	}

	get activeParticleBuffer(): GPUBuffer {
		return this.particleBuffers[(this.t + 1) % 2];
	}

	setDifficulty(difficulty: number) {
		this.difficulty = difficulty;
		this.numParticles = 1024 * difficulty;

		const initialParticleData = new Float32Array(this.numParticles * 6);
		const noise = new p5();
		for (let i = 0; i < this.numParticles; ++i) {
			const p = this.generateRandomParticle(0.7, noise);
			const v = this.calculateInitialVelocity(p.x, p.y, -0.015, noise);

			initialParticleData[6 * i + 0] = p.x;
			initialParticleData[6 * i + 1] = p.y;
			initialParticleData[6 * i + 2] = v.x + (Math.random() - 0.5) * 0.001;
			initialParticleData[6 * i + 3] = v.y + (Math.random() - 0.5) * 0.001;
			initialParticleData[6 * i + 4] = 0;
			initialParticleData[6 * i + 5] = 0;
		}


		if (this.particleBuffers) {
			this.particleBuffers[0].destroy();
			this.particleBuffers[1].destroy();
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

		if (!this.grid) {
			this.grid = new Grid();
		}

		this.grid.init(this.particleBuffers);

		for (let i = 0; i < 2; ++i) {
			this.particleBindGroups[i] = device.createBindGroup({
				layout: this.computePipeline.getBindGroupLayout(0),
				entries: [{
					binding: 0,
					resource: {
						buffer: this.particleBuffers[i],
						offset: 0,
						size: initialParticleData.byteLength,
					},
				}, {
					binding: 1,
					resource: {
						buffer: this.particleBuffers[(i + 1) % 2],
						offset: 0,
						size: initialParticleData.byteLength,
					},
				}, {
					binding: 2,
					resource: {
						buffer: this.uniform.buffer
					}
				}, {
					binding: 3,
					resource: {
						buffer: this.grid.writeBuffers[i]
					}
				}, {
					binding: 4,
					resource: {
						buffer: this.grid.writeBuffers[(i + 1) % 2]
					}
				}],
			});
		}


	}
}

