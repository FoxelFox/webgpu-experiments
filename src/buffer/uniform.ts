import {device} from "../global";
import {mat4} from "wgpu-matrix";

export function createUniform(param: {[key: string]: number | object}): GPUBuffer {
	return
}

export function updateUniform(buffer: GPUBuffer, param: {[key: string]: number}) {
	//device.queue.writeBuffer()
}

export class UniformBuffer {

	buffer: GPUBuffer

	constructor(public data: {[key: string]: number | Float32Array }) {

		let byteSize = 0;

		for (const key in data) {
			switch (typeof data[key]) {
				case "number":
					byteSize += 16; // lol why
					break;
				case "object":
					if ( data[key] instanceof Float32Array) {
						byteSize += 4 * (<Float32Array>data[key]).length;
						break;
					}
			}
		}


		this.buffer = device.createBuffer({
			size: byteSize,
			usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
		});


	}

	update() {
		const data = new Float32Array(this.buffer.size / 4);

		let offset = 0;
		for (const key in this.data) {
			if (typeof this.data[key] == 'number'){
				data.set(new Float32Array([<number>this.data[key]]), offset);
				offset += 1;
			} else {
				data.set(<Float32Array>this.data[key], offset);
				offset += (<Float32Array>this.data[key]).length;
			}
		}

		device.queue.writeBuffer(this.buffer, 0, data);
	}
}
