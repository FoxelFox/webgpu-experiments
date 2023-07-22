import {device} from "../../global";
import gridShader from "./grid.wgsl";

export class Grid {

	pipeline: GPUComputePipeline;
	bindGroup: GPUBindGroup;
	writeBuffer: GPUBuffer;
	readBuffer: GPUBuffer;

	// shader Grid struct
	resolution: [number, number];
	cells: {
		midpoint: [number, number];
		mass: number;
	}[];

	constructor() {

		this.pipeline = device.createComputePipeline({
			layout: 'auto',
			compute: {
				module: device.createShaderModule({
					code: gridShader,
				}),
				entryPoint: 'main',
			}
		});

		this.init();
	}

	init() {
		this.resolution = [8.0, 8.0];
		this.cells = Array(8 * 8).fill({
			midpoint: [0, 0],
			mass: 0
		});

		this.writeBuffer = device.createBuffer({
			mappedAtCreation: true,
			size: this.bufferSizeInByte,
			usage: GPUBufferUsage.COPY_SRC | GPUBufferUsage.STORAGE
		});

		this.readBuffer = device.createBuffer({
			size: this.bufferSizeInByte,
			usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST
		});

		this.writeToGPU();

		this.bindGroup = device.createBindGroup({
			layout: this.pipeline.getBindGroupLayout(0),
			entries: [{
				binding: 0,
				resource: {
					buffer: this.writeBuffer
				}

			}]
		})
	}

	run() {
		const commandEncoder = device.createCommandEncoder();

		const passEncoder = commandEncoder.beginComputePass();
		passEncoder.setPipeline(this.pipeline);
		passEncoder.setBindGroup(0, this.bindGroup);
		passEncoder.dispatchWorkgroups(64);
		passEncoder.end();

		commandEncoder.copyBufferToBuffer(
			this.writeBuffer /* source buffer */,
			0 /* source offset */,
			this.readBuffer /* destination buffer */,
			0 /* destination offset */,
			this.bufferSizeInByte /* size */
		);

		const gpuCommands = commandEncoder.finish();
		device.queue.submit([gpuCommands]);

	}

	writeToGPU() {
		const buffer = this.writeBuffer.getMappedRange();
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

		//console.log("before", new Float32Array(buffer));
		this.writeBuffer.unmap();
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
		for (let x = 0; x < this.resolution[0]; ++x) {
			const debugRow = []
			for (let y = 0; y < this.resolution[1]; ++y) {
				const i = x + y * this.resolution[1];
				this.cells[i].midpoint[0] = view.getFloat32(offset, true); offset += 4;
				this.cells[i].midpoint[1] = view.getFloat32(offset, true); offset += 4;

				this.cells[i].mass = view.getFloat32(offset, true); offset += 4;

				offset += 4; // padding

				debugRow.push([
					this.cells[i].midpoint[0],
					this.cells[i].midpoint[1],
					this.cells[i].mass
				].join(","));
			}
			debugMatrix.push(debugRow);
		}

		console.table({
			resolution: this.resolution
		})
		console.table(debugMatrix);
		//console.log(new Float32Array(buffer))
	}

	get bufferSizeInByte(): number {
		return 4 * 2 + 4 * this.resolution[0] * this.resolution[1] * 4;
	}


}
