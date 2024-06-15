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
				entryPoint: 'vert_main'
				// buffers: [{
				//
				// }]
			}
		})
	}


}