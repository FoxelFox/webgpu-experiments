import {Terrain} from "../terrain";
import {device} from "../../../global";
import shader from "./draw.wgsl";


// language=WGSL
const vertexShader = /* wgsl */`
struct VertexInput {
    @location(0) position : vec3<f32>;
};

struct VertexOutput {
    @builtin(position) position : vec4<f32>;
};

@vertex
fn main(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    output.position = vec4<f32>(input.position, 1.0);
    return output;
}
`;

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