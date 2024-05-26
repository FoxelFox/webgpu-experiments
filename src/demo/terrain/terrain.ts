import {UniformBuffer} from "../../data/uniform";
import {mat4, vec4} from "wgpu-matrix";
import {device} from "../../global";

export class Terrain {

	canvas: HTMLCanvasElement;
	context: GPUCanvasContext;
	uniform: UniformBuffer;


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