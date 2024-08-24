import {Terrain} from "../terrain";
import {device} from "../../../global";
import shader from "./draw.wgsl";


export class Draw {

	pipeline: GPURenderPipeline
	bindGroup: GPUBindGroup

	constructor(private demo: Terrain) {
		this.pipeline = device.createRenderPipeline({
			layout: 'auto',
			vertex: {
				module: device.createShaderModule({
					code: shader
				}),
				entryPoint: 'vert_main',
				buffers: [{
					arrayStride: 3 * Float32Array.BYTES_PER_ELEMENT,
					attributes: [{
						shaderLocation: 0,
						format: 'float32x3',
						offset: 0,
					}]
				}]
			},
			fragment: {
				module: device.createShaderModule({
					code: shader
				}),
				entryPoint: 'main',
				targets: [{
					format: navigator.gpu.getPreferredCanvasFormat(),
				}],
			},
			primitive: {
				topology: 'triangle-list',
			},
		})
	}

	update() {
		const commandEncoder = device.createCommandEncoder({label: "TerrainCommandEncoder"});
		const renderPassDescriptor: GPURenderPassDescriptor = {
			colorAttachments: [{
				view: this.demo.context.getCurrentTexture().createView(),
				loadOp: 'clear',
				clearValue: {r: 0, g: 0, b: 0, a: 1},
				storeOp: 'store',
			}],
		};

		const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
		passEncoder.setPipeline(this.pipeline);
		passEncoder.setVertexBuffer(0, this.demo.vertexBuffer);
		passEncoder.setIndexBuffer(this.demo.indexBuffer, 'uint16');
		passEncoder.drawIndexed(this.demo.indices.length);
		passEncoder.end();

		device.queue.submit([commandEncoder.finish()]);
	}
}