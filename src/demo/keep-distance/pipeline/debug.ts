import {KeepDistance} from "../keep-distance";
import {device} from "../../../global";
import screenQuad from "./screen-quad.wgsl";
import debug from "./debug.wgsl";

export class Debug {

    pipeline: GPURenderPipeline
    bindGroup: GPUBindGroup

    constructor(private demo: KeepDistance) {

        this.pipeline = device.createRenderPipeline({
            layout: "auto",
            vertex: {
                module: device.createShaderModule({
                    code: screenQuad,
                }),
                entryPoint: 'main'
            },
            fragment: {
                module: device.createShaderModule({
                    code: debug,
                }),
                entryPoint: 'main',
                targets: [{
                    format: navigator.gpu.getPreferredCanvasFormat(),
                }]
            },
            primitive: {
                topology: 'triangle-list',
                cullMode: 'back'
            }
        });

		this.createBindGroup();
    }

	createBindGroup() {
		this.bindGroup = device.createBindGroup({
			layout: this.pipeline.getBindGroupLayout(0),
			entries: [
				{
					binding: 0,
					resource: this.demo.scaledDistanceTexture.createView()
				}
			]
		});
	}

    update(commandEncoder: GPUCommandEncoder) {

        // draw to screen
        const passDescriptor: GPURenderPassDescriptor =  {
            colorAttachments: [
                {
                    view:  this.demo.context.getCurrentTexture().createView(),
                    clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
                    loadOp: 'clear',
                    storeOp: 'store',
                },
            ],
        };


        const passEncoder = commandEncoder.beginRenderPass(passDescriptor);
        passEncoder.setPipeline(this.pipeline);
        passEncoder.setBindGroup(0, this.bindGroup);
        passEncoder.draw(6);
        passEncoder.end();

    }
}