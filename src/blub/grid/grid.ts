import {device} from "../../global";
import gridShader from "grid.wgsl";

export class Grid {

	pipeline: GPUComputePipeline;
	bindGroup: GPUBindGroup;
	writeBuffer: GPUBuffer;
	readBuffer: GPUBuffer;

	// shader Grid struct
	size: [number, number];
	cells: [number, number];
	min: [number, number];
	max: [number, number];
	indices: Int32Array;

	constructor(private numParticles: number) {

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
		this.size = [-1, 1];
		this.cells = [8, 8];
		this.min = [-1, -1];
		this.max = [1, 1];
		this.indices = new Int32Array(this.indexLength);

		this.writeBuffer = device.createBuffer({
			mappedAtCreation: true,
			size: this.bufferSizeInByte,
			usage: GPUBufferUsage.MAP_WRITE | GPUBufferUsage.COPY_SRC
		});

		this.readBuffer = device.createBuffer({
			size: this.bufferSizeInByte,
			usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST
		});

		this.bindGroup = device.createBindGroup({
			layout: this.pipeline.getBindGroupLayout(0),
			entries: [{
				binding: 0,
				resource: {
					buffer: this.writeBuffer
				}
			}]

		})


		this.writeToGPU();
	}

	writeToGPU() {
		const buffer = this.writeBuffer.getMappedRange();
		const indexLength = this.indexLength;
		const view = new DataView(buffer);

		let offset = 0;
		view.setFloat32(offset, this.size[0]); offset += 4;
		view.setFloat32(offset, this.size[1]); offset += 4;

		view.setInt32(offset, this.cells[0]); offset += 4;
		view.setInt32(offset, this.cells[1]); offset += 4;

		view.setFloat32(offset, this.min[0]); offset += 4;
		view.setFloat32(offset, this.min[1]); offset += 4;

		view.setFloat32(offset, this.max[0]); offset += 4;
		view.setFloat32(offset, this.max[1]); offset += 4;

		for (let i = 0; i < indexLength; ++i) {
			view.setInt32(offset, -1);
			offset += 4;
		}

		this.writeBuffer.unmap();
	}

	async readFromGPU() {
		const copyEncoder = device.createCommandEncoder();
		copyEncoder.copyBufferToBuffer(
			this.writeBuffer /* source buffer */,
			0 /* source offset */,
			this.readBuffer /* destination buffer */,
			0 /* destination offset */,
			this.bufferSizeInByte /* size */
		);

		const copyCommands = copyEncoder.finish();
		device.queue.submit([copyCommands]);

		// Read buffer.
		await this.readBuffer.mapAsync(GPUMapMode.READ);
		const buffer = this.readBuffer.getMappedRange();

		const view = new DataView(buffer);

		let offset = 0;
		this.size[0] = view.getFloat32(offset); offset += 4;
		this.size[1] = view.getFloat32(offset); offset += 4;

		this.cells[0] = view.getInt32(offset); offset += 4;
		this.cells[1] = view.getInt32(offset); offset += 4;

		this.min[0] = view.getFloat32(offset); offset += 4;
		this.min[1] = view.getFloat32(offset); offset += 4;

		this.max[0] = view.getFloat32(offset); offset += 4;
		this.max[1] = view.getFloat32(offset); offset += 4;


		this.indices = new Int32Array(buffer, offset);

		console.table({
			numParticles: this.numParticles,
			size: this.size,
			cells: this.cells,
			min: this.min,
			max: this.max
		});


		let matrix = [];
		for (let i = 0; i < this.cells[0]; i++) {
			let row = [];
			for (let j = 0; j < this.cells[1]; j++) {
				let cell = [];
				for (let k = 0; k < 4; k++) {
					cell.push(this.indices[i * 32 + j * this.numParticles + k]);
				}
				row.push(cell.join(', '));
			}
			matrix.push(row);
		}

		console.table(matrix)
	}

	get indexLength(): number {
		return this.numParticles * this.cells[0] * this.cells[1];
	}

	get bufferSizeInByte(): number {
		return 4*2 + 4*2 + 4*2 + 4*2 + this.indexLength * 4;
	}


}
