import {device} from "../../../global";
import shader from "./draw-particles.wgsl";
import {quad} from "../../../data/primitive";
import {KeepDistance} from "../keep-distance";

export class DrawParticles {

    pipeline: GPURenderPipeline
    bindGroup

    constructor(private demo: KeepDistance) {
        this.pipeline = device.createRenderPipeline({
            layout: 'auto',
            vertex: {

                module: device.createShaderModule({
                    code: shader,
                }),
                entryPoint: 'vert_main',
                buffers: [{
                    arrayStride: 2 * 4,
                    attributes: [{
                        shaderLocation: 0,
                        format: "float32x2",
                        offset: 0
                    }, ]
                }, {
                    arrayStride: 6 * 4,
                    stepMode: 'instance',
                    attributes: [{
                        // instance position
                        shaderLocation: 3,
                        offset: 0,
                        format: 'float32x2',
                    }, {
                        // instance velocity
                        shaderLocation: 1,
                        format: "float32x2",
                        offset: 2 * 4
                    }, {
                        // instance force
                        shaderLocation: 2,
                        format: "float32x2",
                        offset: 4 * 4
                    }]
                }]
            },
            fragment: {
                module: device.createShaderModule({
                    code: shader,
                }),
                entryPoint: 'frag_main',
                targets: [
                    {
                        format: 'bgra8unorm',
                        blend: {
                            color: {
                                srcFactor: 'src-alpha',
                                dstFactor: 'one',
                                operation: 'add',
                            },
                            alpha: {
                                srcFactor: 'zero',
                                dstFactor: 'one',
                                operation: 'add',
                            },
                        },
                    },
					{
                        format: 'rgba32uint'
                    },
                ],
            },
            primitive: {
                topology: 'triangle-list'
            },
        });

		this.createBindGroup();
    }

	createBindGroup() {
		this.bindGroup = device.createBindGroup({
			layout: this.pipeline.getBindGroupLayout(0),
			entries: [{
				binding: 0,
				resource: {buffer: this.demo.uniform.buffer}
			}, {
				binding: 1,
				resource: this.demo.colorTexture.createView()

			}]
		});
	}


    update(commandEncoder: GPUCommandEncoder) {

        // draw to screen
        const textureView = this.demo.context.getCurrentTexture().createView();
        const renderPassDescriptor: GPURenderPassDescriptor = {
            colorAttachments: [
                {
                    view: textureView,
                    clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
                    loadOp: 'clear',
                    storeOp: 'store',
                },
                {
                    view: this.demo.pickingTexture.createView(),
                    clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
                    loadOp: 'clear',
                    storeOp: 'store',
                },
            ],
        };

        const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
        passEncoder.setPipeline(this.pipeline);
        passEncoder.setBindGroup(0, this.bindGroup);
        passEncoder.setVertexBuffer(0, quad(0.001 / Math.pow(this.demo.user.zoom, 0.5)));
        passEncoder.setVertexBuffer(1, this.demo.activeParticleBuffer);
        passEncoder.draw(6, this.demo.numParticles, 0, 0);
        passEncoder.end();
    }

}