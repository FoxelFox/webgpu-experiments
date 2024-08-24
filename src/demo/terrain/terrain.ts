import {UniformBuffer} from "../../data/uniform";
import {mat4, vec4} from "wgpu-matrix";
import {device} from "../../global";

export class Terrain {

	canvas: HTMLCanvasElement
	context: GPUCanvasContext
	uniform: UniformBuffer

	vertices: Float32Array
	indices: Uint16Array
	vertexBuffer: GPUBuffer
	indexBuffer: GPUBuffer

	setCanvasSize = () => {
		this.canvas.width = window.innerWidth * devicePixelRatio;
		this.canvas.height = window.innerHeight * devicePixelRatio;

		const ar = this.canvas.width / this.canvas.height;
		const fov = 110 * Math.PI / 180;

		this.uniform.data.viewMatrix = mat4.perspective(fov, ar, 0.1, 1000);
	}

	async start() {
		await this.init();
	}

	async init() {
		document.body.innerHTML =`
			<div id="score" style="color: white"></div>
			<canvas></canvas>
		`;

		this.uniform = new UniformBuffer({
			viewMatrix: mat4.create()
		});


		this.vertices = new Float32Array([
			-1.0, -1.0, 0.0,
			1.0, -1.0, 0.0,
			-1.0,  1.0, 0.0,
			1.0,  1.0, 0.0,
		]);

		this.indices = new Uint16Array([
			0, 1, 2,
			2, 1, 3,
		]);

		this.vertexBuffer = device.createBuffer({
			size: this.vertices.byteLength,
			usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
		});
		device.queue.writeBuffer(this.vertexBuffer, 0, this.vertices);

		this.indexBuffer = device.createBuffer({
			size: this.indices.byteLength,
			usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
		});

		device.queue.writeBuffer(this.indexBuffer, 0, this.indices);

		this.canvas = document.getElementsByTagName("canvas")[0];
		this.setCanvasSize();

		this.context = this.canvas.getContext('webgpu') as GPUCanvasContext;
		const presentationFormat = navigator.gpu.getPreferredCanvasFormat();

		this.context.configure({
			device: device,
			format: presentationFormat,
			alphaMode: 'premultiplied',
		});
	}
}