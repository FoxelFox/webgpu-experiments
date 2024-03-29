import {device} from "../../global";
import shader from "./physics.wgsl";
import {MultipleBuffer} from "../../data/multiple-buffer";
import {KeepDistance} from "./keep-distance";
import {UniformBuffer} from "../../data/uniform";

export class Physics {
    particleBindGroups: GPUBindGroup[]
    computePipeline: GPUComputePipeline

    constructor(private demo: KeepDistance) {
        this.computePipeline = device.createComputePipeline({
            layout: 'auto',
            compute: {
                module: device.createShaderModule({
                    code: shader,
                }),
                entryPoint: 'main',
            }
        });
    }

    updateBindGroup(particles: MultipleBuffer, uniform: UniformBuffer) {
        this.particleBindGroups = new Array(2);
        for (let i = 0; i < particles.buffers.length; ++i) {
            this.particleBindGroups[i] = device.createBindGroup({
                layout: this.computePipeline.getBindGroupLayout(0),
                entries: [{
                    binding: 0,
                    resource: {
                        buffer: particles.buffers[i],
                        offset: 0,
                        size:  particles.buffers[i].size,
                    },
                }, {
                    binding: 1,
                    resource: {
                        buffer: particles.buffers[(i + 1) % 2],
                        offset: 0,
                        size: particles.buffers[(i + 1) % 2].size,
                    },
                }, {
                    binding: 2,
                    resource: {
                        buffer: uniform.buffer
                    }
                }],
            });
        }
    }

    update(commandEncoder: GPUCommandEncoder) {
        const passEncoder = commandEncoder.beginComputePass();
        passEncoder.setPipeline(this.computePipeline);
        passEncoder.setBindGroup(0, this.particleBindGroups[this.demo.t % 2]);
        passEncoder.dispatchWorkgroups(Math.ceil(this.demo.numParticles / 64));
        passEncoder.end();
    }
}

