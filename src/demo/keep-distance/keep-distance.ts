import { mat4, vec2, vec3, vec4 } from "wgpu-matrix";
import { UniformBuffer } from "../../data/uniform";
import { device } from "../../global";
import p5 from 'p5';
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
	readPixelBuffer: GPUBuffer
	textureSize = 2048 / 1
	particles: MultipleBuffer
	canvasWasResized: boolean
	importer: Import

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

			//await device.queue.onSubmittedWorkDone();
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

		this.importer = new Import();
		await this.importer.start();

		this.numParticles = this.importer.settings.nodes;

		// data
		this.uniform = new UniformBuffer({
			viewMatrix: mat4.create(),
			mouse: vec4.create(),
			textureSize: this.textureSize,
			edgeTextureSize: this.importer.settings.Size,
			maxEdges: this.importer.settings.maxEdges
			
		});

		this.readPixelBuffer = device.createBuffer({
			label: "readPixelBuffer",
			size: 256,
			usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
		});

		this.distanceTexture = device.createTexture({
			label: "distanceTexture",
			size: [this.textureSize, this.textureSize],
			usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
			format: 'rgba32float',
		});

		this.pickingTexture = device.createTexture({
			label: "pickingTexture",
			size: [this.canvas.width, this.canvas.height],
			usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC,
			format: 'rgba32uint',
		})

		this.edgeTexture = device.createTexture({
			label: "edgeTexture",
			size: [this.importer.settings.maxEdges, this.importer.settings.Size, this.importer.settings.Size],
			usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
			format: "rgba32float",
			dimension: "3d"
		});

		this.colorTexture = device.createTexture({
			label: "colorTexture",
			size: [this.importer.settings.Size, this.importer.settings.Size],
			usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
			format: "rgba8unorm"
		});

		device.queue.writeTexture(
			{ texture: this.edgeTexture },
			new Float32Array(this.importer.settings.data),
			{
				bytesPerRow: this.importer.settings.maxEdges * 4 * 4,
				rowsPerImage: this.importer.settings.Size
			},
			[this.importer.settings.maxEdges, this.importer.settings.Size, this.importer.settings.Size]
		);

		device.queue.writeTexture(
			{texture: this.colorTexture},
			new Int8Array(this.importer.settings.colors),
			{bytesPerRow: this.importer.settings.Size * 4},
			[this.importer.settings.Size, this.importer.settings.Size]
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

		this.canvasWasResized = this.pickingTexture.width !== this.canvas.width || this.pickingTexture.height !== this.canvas.height;

		if (this.canvasWasResized) {
			this.pickingTexture.destroy();
			this.pickingTexture = device.createTexture({
				label: "pickingTexture",
				size: [this.canvas.width, this.canvas.height],
				usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC,
				format: 'rgba32uint',
			});


			// BindGroups that uses this Texture needs to be recreated
			this.debug.createBindGroup();
			this.drawParticles.createBindGroup();
		}
	}

	update = async () => {
		this.user.updateCamera();
		this.uniform.update();
		this.resizeTextures();


		const commandEncoder = device.createCommandEncoder({label: "keep-distance-main"});

		if (!this.user.pause) {
			this.physics.update(commandEncoder);
			this.distance.update(commandEncoder);
		}

		if (this.user.debugMode) {
			this.debug.update(commandEncoder);
			device.queue.submit([commandEncoder.finish()]);
		} else {
			this.drawParticles.update(commandEncoder);
			await this.readPixelUnderMouse(commandEncoder);
		}


		if (!this.user.pause) {
			++this.t;
		}


	}

	async readPixelUnderMouse(commandEncoder: GPUCommandEncoder) {


		let x = Math.min(Math.max(this.user.mouseX, 0), this.canvas.width -1);
		let y = Math.min(Math.max(this.user.mouseY, 0), this.canvas.height -1);


		// because minimum bytes to read is 256 we have to handle this pixel picking with an offset if we are out of bounds
		let offset = 0;
		if ((x + 16) > this.canvas.width) {
			offset = (this.canvas.width - x -16) * -1;
		}


		commandEncoder.copyTextureToBuffer(
			{texture: this.pickingTexture, origin: {
					x: x - offset,
					y: y
			}},
			{buffer: this.readPixelBuffer, bytesPerRow: 256},
			{width: 16, height: 1}
		);

		device.queue.submit([commandEncoder.finish()]);

		await this.readPixelBuffer.mapAsync(GPUMapMode.READ)
		let arrayBuffer = this.readPixelBuffer.getMappedRange();
		let dataView = new DataView(arrayBuffer);
		let pixelValue = dataView.getUint32(offset * 16, true); // Read the pixel value as a 32-bit unsigned integer

		if (pixelValue && this.user.mouseDown) {
			const id = this.importer.indexToId[pixelValue];
			const link = document.getElementById("link")
			link.setAttribute("href", `https://store.steampowered.com/app/${id}`)


			const url = `https://steamcdn-a.akamaihd.net/steam/apps/${id}/header.jpg`;
			const img = document.getElementById("img");
			if (img.getAttribute("src") !== url) {
				img.setAttribute("src",url)
			}


		}


		this.readPixelBuffer.unmap();

	}

	get activeParticleBuffer(): GPUBuffer {
		return this.particles.buffers[(this.t + 1) % 2];
	}
}