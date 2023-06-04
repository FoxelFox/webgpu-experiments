import {device} from "../../global";
import updateShader from "../update.wgsl";

export class Grid {

	pipeline: GPUComputePipeline

	constructor(
		indices,
		positions
	) {

		this.pipeline = device.createComputePipeline({
			layout: 'auto',
			compute: {
				module: device.createShaderModule({
					code: updateShader,
				}),
				entryPoint: 'main',
			}
		});

	}


}
