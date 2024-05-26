import {device} from "../../../global";

export class Mesh {

	vertices: GPUBuffer
	indices: GPUBuffer

	constructor(public size: number) {
		const vertexData = new Float32Array([
			-1.0, -1.0, 0.0,
			1.0, -1.0, 0.0,
			-1.0,  1.0, 0.0,
			1.0,  1.0, 0.0,
		]);

		const indexData = new Uint16Array([
			0, 1, 2,
			2, 1, 3,
		]);

		this.vertices = device.createBuffer({
			size: vertexData.byteLength,
			usage: GPUBufferUsage.VERTEX | GPUTextureUsage.COPY_DST
		})
		device.queue.writeBuffer(this.vertices, 0, vertexData);

		this.indices = device.createBuffer({
			size: indexData.byteLength,
			usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST
		});
		device.queue.writeBuffer(this.indices, 0, indexData);
	}
}