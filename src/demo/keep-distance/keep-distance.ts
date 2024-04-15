import { mat4, vec2, vec3, vec4 } from "wgpu-matrix";
import { UniformBuffer } from "../../data/uniform";
import { device } from "../../global";
import p5 from 'p5';
import vertexTextureQuad from "./pipeline/screen-quad.wgsl";
import debug from "./pipeline/debug.wgsl";
import { Physics } from "./pipeline/physics";
import { MultipleBuffer } from "../../data/multiple-buffer";
import { Distance } from "./pipeline/distance";
import { Debug } from "./pipeline/debug";
import { DrawParticles } from "./pipeline/draw-particles";
import { User } from "./input/user";
import { Import } from "./input/import";



// Only limited by max dispatchWorkgroups in WebGPU
// If more needed we have to split the dispatch into
// multipe chunks or calulate more at once
const MAX_PARTICLES = 4194304 - 64;

export class KeepDistance {

	canvas: HTMLCanvasElement

	uniform: UniformBuffer
	context: GPUCanvasContext
	distanceTexture: GPUTexture
	edgeTexture: GPUTexture
	colorTexture: GPUTexture
	pickingTexture: GPUTexture
	textureSize = 2048 / 4;
	particles: MultipleBuffer

	t = 0
	user: User

	numParticles = 4194304 - 64;

	physics: Physics
	distance: Distance
	debug: Debug
	drawParticles: DrawParticles

	async start() {
		await this.init();
		await this.update();

		let before = Date.now();
		let fps = 60;
		let score = 0;

		const loop = async () => {

			await device.queue.onSubmittedWorkDone();
			await this.update();

			const now = Date.now();
			const time = now - before;
			before = now;

			// filter fps spikes
			if (Math.abs(fps - 1000 / time) > 1) {
				fps = (fps + (fps < 1000 / time ? fps + 1 : fps - 1)) / 2;
			} else {
				fps = (fps * 9 + 1000 / time) / 10;
			}




			document.getElementById("score").innerHTML = `FPS ${Math.round(fps)}`

			requestAnimationFrame(loop);
		}
		await loop();
	}

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

		//return {x: vx, y: vy};
		return { x: 0, y: 0 };
	}

	generateRandomParticle(radius: number, noise: p5): { x: number, y: number } {
		// Wähle den Radius und den Winkel zufällig aus
		const r = Math.sqrt(Math.random()) * radius;
		const theta = Math.random() * 2 * Math.PI;

		// Berechne die kartesischen Koordinaten
		const x = r * Math.cos(theta);
		const y = r * Math.sin(theta);

		return { x, y };
	}

	async init() {

		
		this.canvas = document.getElementsByTagName("canvas")[0];
		console.log("canvas",this.canvas.width)

		const importer = new Import();
		await importer.start();

		this.numParticles = importer.settings.nodes;

		// data
		this.uniform = new UniformBuffer({
			viewMatrix: mat4.create(),
			mouse: vec4.create(),
			textureSize: this.textureSize,
			edgeTextureSize: importer.settings.Size,
			maxEdges: importer.settings.maxEdges
			
		});

		this.distanceTexture = device.createTexture({
			size: [this.textureSize, this.textureSize],
			usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
			format: 'rgba32float',
		});

		this.pickingTexture = device.createTexture({
			size: [this.canvas.width, this.canvas.height],
			usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
			format: 'rgba32float',
		})

		this.edgeTexture = device.createTexture({
			size: [importer.settings.maxEdges, importer.settings.Size, importer.settings.Size],
			usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
			format: "rgba32float",
			dimension: "3d"
		});

		this.colorTexture = device.createTexture({
			size: [importer.settings.Size, importer.settings.Size],
			usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
			format: "rgba8unorm"
		});

		device.queue.writeTexture(
			{ texture: this.edgeTexture },
			new Float32Array(importer.settings.data),
			{
				bytesPerRow: importer.settings.maxEdges * 4 * 4,
				rowsPerImage: importer.settings.Size
			},
			[importer.settings.maxEdges, importer.settings.Size, importer.settings.Size]
		);

		device.queue.writeTexture(
			{texture: this.colorTexture},
			new Int8Array(importer.settings.colors),
			{bytesPerRow: importer.settings.Size * 4},
			[importer.settings.Size, importer.settings.Size]
		)

		this.particles = new MultipleBuffer(2);
		this.user = new User(this);

		// context
		this.user.updateCamera();

		this.context = this.canvas.getContext('webgpu') as GPUCanvasContext;
		const presentationFormat = navigator.gpu.getPreferredCanvasFormat();

		this.context.configure({
			device: device,
			format: presentationFormat,
			alphaMode: 'premultiplied',
		});


		// pipelines
		this.physics = new Physics(this);
		this.distance = new Distance(this);
		this.debug = new Debug(this);
		this.drawParticles = new DrawParticles(this);

		// other stuff
		this.createParticleBuffer();
	}

	createParticleBuffer() {

		const initialParticleData = new Float32Array(this.numParticles * 6);
		const noise = new p5();
		for (let i = 0; i < this.numParticles; ++i) {
			const p = this.generateRandomParticle(1, noise);
			const v = this.calculateInitialVelocity(p.x, p.y, -0.015, noise);

			initialParticleData[6 * i + 0] = p.x;
			initialParticleData[6 * i + 1] = p.y;
			initialParticleData[6 * i + 2] = v.x + (Math.random() - 0.5) * 0.0001;
			initialParticleData[6 * i + 3] = v.y + (Math.random() - 0.5) * 0.0001;
			initialParticleData[6 * i + 4] = 0;
			initialParticleData[6 * i + 5] = 0;
		}

		this.particles.update(initialParticleData);
		this.physics.updateBindGroup(this.particles, this.uniform);
	}

	resizeTextures() {
		if (this.pickingTexture.width !== this.canvas.width || this.pickingTexture.height !== this.canvas.height) {
			// TODO
			this.pickingTexture.destroy();
			this.pickingTexture = device.createTexture({
				size: [this.canvas.width, this.canvas.height],
				usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
				format: 'rgba32float',
			});
		}
	}

	update = async () => {
		this.user.updateCamera();
		this.uniform.update();
		this.resizeTextures();


		const commandEncoder = device.createCommandEncoder();

		this.physics.update(commandEncoder);
		this.distance.update(commandEncoder);

		if (this.user.debugMode) {
			this.debug.update(commandEncoder);
		} else {
			this.drawParticles.update(commandEncoder);
		}

		++this.t;
		device.queue.submit([commandEncoder.finish()]);
	}

	get activeParticleBuffer(): GPUBuffer {
		return this.particles.buffers[(this.t + 1) % 2];
	}
}