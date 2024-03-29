import {device} from "../../../global";
import gridShader from "./grid.wgsl";

export class Grid {

	pipeline: GPUComputePipeline;
	bindGroups: GPUBindGroup[];
	writeBuffers: GPUBuffer[];
	readBuffer: GPUBuffer;

	// shader Grid struct
	resolution: [number, number];
	cells: {
		midpoint: [number, number];
		mass: number;
	}[];

	constructor() {

		this.writeBuffers = new Array(2);

		this.pipeline = device.createComputePipeline({
			layout: 'auto',
			compute: {
				module: device.createShaderModule({
					code: gridShader,
				}),
				entryPoint: 'main',
			}
		});
	}

	init(particles: GPUBuffer[]) {

		if (this.writeBuffers[0]) {
			this.writeBuffers[0].destroy();
			this.writeBuffers[1].destroy();
			this.readBuffer.destroy();
		}

		const res = 16;
		this.resolution = [res, res];
		this.cells = Array(res * res).fill({
			midpoint: [0, 0],
			mass: 0
		});

		for (let i = 0; i < this.writeBuffers.length; ++i) {
			this.writeBuffers[i] = device.createBuffer({
				mappedAtCreation: true,
				size: this.bufferSizeInByte,
				usage: GPUBufferUsage.COPY_SRC | GPUBufferUsage.STORAGE
			});
		}

		this.readBuffer = device.createBuffer({
			size: this.bufferSizeInByte,
			usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST
		});

		this.writeToGPU();

		this.bindGroups = new Array(2);

		for(let i = 0; i < 2; ++i) {
			this.bindGroups[i] = device.createBindGroup({
				layout: this.pipeline.getBindGroupLayout(0),
				entries: [{
					binding: 0,
					resource: {
						buffer: this.writeBuffers[i]
					}
				}, {
					binding: 1,
					resource: {
						buffer: particles[i]
					}
				}]
			})
		}
	}

	run(commandEncoder: GPUCommandEncoder, t: number) {
		const passEncoder = commandEncoder.beginComputePass();
		passEncoder.setPipeline(this.pipeline);
		passEncoder.setBindGroup(0, this.bindGroups[t % 2]);
		passEncoder.dispatchWorkgroups(Math.ceil(this.resolution[0] * this.resolution[1] / 64));
		passEncoder.end();

		// commandEncoder.copyBufferToBuffer(
		// 	this.writeBuffer /* source buffer */,
		// 	0 /* source offset */,
		// 	this.readBuffer /* destination buffer */,
		// 	0 /* destination offset */,
		// 	this.bufferSizeInByte /* size */
		// );
	}

	writeToGPU() {
		for (let i = 0; i < this.writeBuffers.length; ++i) {
			const buffer = this.writeBuffers[i].getMappedRange();
			const view = new DataView(buffer);

			let offset = 0;

			view.setFloat32(offset, this.resolution[0], true); offset += 4;
			view.setFloat32(offset, this.resolution[1], true); offset += 4;

			for (let x = 0; x < this.resolution[0]; ++x) {
				for (let y = 0; y < this.resolution[1]; ++y) {
					const i = x + y * this.resolution[1];
					view.setFloat32(offset, this.cells[i].midpoint[0], true); offset += 4;
					view.setFloat32(offset, this.cells[i].midpoint[1], true); offset += 4;

					view.setFloat32(offset, this.cells[i].mass, true); offset += 4;

					offset += 4; // padding
				}
			}

			this.writeBuffers[i].unmap();
		}
	}

	async readFromGPU() {
		// const copyEncoder = device.createCommandEncoder();
		// copyEncoder.copyBufferToBuffer(
		// 	this.writeBuffer /* source buffer */,
		// 	0 /* source offset */,
		// 	this.readBuffer /* destination buffer */,
		// 	0 /* destination offset */,
		// 	this.bufferSizeInByte /* size */
		// );
		//
		// const copyCommands = copyEncoder.finish();
		// device.queue.submit([copyCommands]);

		// Read buffer.
		await this.readBuffer.mapAsync(GPUMapMode.READ);
		const buffer = this.readBuffer.getMappedRange();

		const view = new DataView(buffer);

		let offset = 0;

		this.resolution[0] = view.getFloat32(offset, true); offset += 4;
		this.resolution[1] = view.getFloat32(offset, true); offset += 4;



		let debugMatrix = [];
		let debugMass = 0;
		for (let x = 0; x < this.resolution[0]; ++x) {
			const debugRow = []
			for (let y = 0; y < this.resolution[1]; ++y) {
				const i = x + y * this.resolution[1];
				this.cells[i].midpoint[0] = view.getFloat32(offset, true); offset += 4;
				this.cells[i].midpoint[1] = view.getFloat32(offset, true); offset += 4;

				this.cells[i].mass = view.getFloat32(offset, true); offset += 4;

				offset += 4; // padding

				debugMass += this.cells[i].mass;
				debugRow.push(this.cells[i].mass)

			}
			debugMatrix.push(debugRow);
		}

		console.clear();
		console.table(debugMatrix);
		console.log(debugMass)

		this.readBuffer.unmap();
	}

	get bufferSizeInByte(): number {
		return 4 * 2 + 4 * this.resolution[0] * this.resolution[1] * 4;
	}


}
