import {KeepDistance} from "../keep-distance";
import {device} from "../../../global";
import shader from "./scale.wgsl";

export class Scale {

	pipeline: GPUComputePipeline
	bindGroup: GPUBindGroup

	constructor(private demo: KeepDistance) {
		this.pipeline = device.createComputePipeline({
			layout: 'auto',
			compute: {
				module: device.createShaderModule({
					code: shader,
				}),
				entryPoint: 'main',
			}
		});

		this.bindGroup = device.createBindGroup({
			layout: this.pipeline.getBindGroupLayout(0),
			entries: [{
				binding: 0,
				resource: this.demo.distanceTexture.createView()
			}, {
				binding: 1,
				resource: this.demo.scaledDistanceTexture.createView()
			}, {
				binding: 2,
				resource: {
					buffer: this.demo.uniform.buffer
				}
			}]
		});
	}

	update(commandEncoder: GPUCommandEncoder) {
		const passEncoder = commandEncoder.beginComputePass();
		passEncoder.setPipeline(this.pipeline);
		passEncoder.setBindGroup(0, this.bindGroup);
		passEncoder.dispatchWorkgroups(
			16,16
			//this.demo.scaledDistanceTexture.width / 8,
			//this.demo.scaledDistanceTexture.height / 8
		);
		passEncoder.end();
	}
}