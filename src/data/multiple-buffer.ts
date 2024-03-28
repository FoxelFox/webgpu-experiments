import {device} from "../global";

export class MultipleBuffer {

    buffers: GPUBuffer[];

    constructor(private multiples: number, data?: Float32Array) {
        if (data) {
            this.update(data);
        }
    }

    update(data: Float32Array) {
        if (this.buffers) {
            this.buffers[0].destroy();
            this.buffers[1].destroy();
        }

        this.buffers = new Array(this.multiples);

        for (let i = 0; i < this.multiples; ++i) {
            this.buffers[i] = device.createBuffer({
                size: data.byteLength,
                usage: GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE,
                mappedAtCreation: true,
            });
            new Float32Array(this.buffers[i].getMappedRange()).set(
                data
            );
            this.buffers[i].unmap();
        }
    }
}