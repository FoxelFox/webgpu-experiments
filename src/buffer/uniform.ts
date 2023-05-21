import {device} from "../global";

export function createUniform(param: {[key: string]: number}): GPUBuffer {
	return
}

export function updateUniform(buffer: GPUBuffer, param: {[key: string]: number}) {
	//device.queue.writeBuffer()
}

export class UniformBuffer {

	buffer: GPUBuffer

	constructor(public data: {[key: string]: number}) {

		let size = 0;

		for (const key in data) {
			console.log(typeof data[key])
		}


		this.buffer = device.createBuffer({
			size: Float32Array.BYTES_PER_ELEMENT * Object.keys(this.data).length,
			usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
		});
	}

	update() {
		device.queue.writeBuffer(this.buffer, 0, new Float32Array(Object.values(this.data)));
	}
}
