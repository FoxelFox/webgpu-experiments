import {device} from "../../global";
import shader from "./physics.wgsl";

export class Physics {
    computePipeline: GPUComputePipeline

    constructor() {
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
}