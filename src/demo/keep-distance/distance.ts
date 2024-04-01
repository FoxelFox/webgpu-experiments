import {device} from "../../global";
import distance from "./distance.wgsl";
import {quad} from "../../data/primitive";
import {KeepDistance} from "./keep-distance";

export class Distance {

    pipeline: GPURenderPipeline
    bindGroup

    constructor(private demo: KeepDistance) {
        this.pipeline = device.createRenderPipeline({
            layout: 'auto',
            vertex: {

                module: device.createShaderModule({
                    code: distance,
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
                    code: distance,
                }),
                entryPoint: 'frag_main',
                targets: [
                    {
                        format: 'rgba32float',
                        blend: {
                            color: {
                                srcFactor: 'one',
                                dstFactor: 'one',
                                operation: 'add',
                            },
                            alpha: {
                                srcFactor: 'one',
                                dstFactor: 'one',
                                operation: 'add',
                            },
                        },
                    },
                ],
            },
            primitive: {
                topology: 'triangle-list'
            },
        });

        this.bindGroup = device.createBindGroup({
            layout: this.pipeline.getBindGroupLayout(0),
            entries: [{
                binding: 0,
                resource: {buffer: this.demo.uniform.buffer}
            }]
        });
    }

    update(commandEncoder: GPUCommandEncoder) {

        let textureView = this.demo.texture.createView();
        // draw to distance texture
        {
            const writeTextureDescriptor: GPURenderPassDescriptor = {
                colorAttachments: [
                    {
                        view: textureView,

                        clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 0.0 },
                        loadOp: 'clear',
                        storeOp: 'store',
                    },
                ]
            }

            const passEncoder = commandEncoder.beginRenderPass(writeTextureDescriptor);
            passEncoder.setPipeline(this.pipeline);
            passEncoder.setBindGroup(0, this.bindGroup);
            passEncoder.setVertexBuffer(0, quad(0.0016));
            passEncoder.setVertexBuffer(1, this.demo.activeParticleBuffer);
            passEncoder.draw(6, this.demo.numParticles, 0, 0);
            passEncoder.end();
        }
    }
}