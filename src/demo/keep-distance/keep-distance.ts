import {mat4, vec4} from "wgpu-matrix";
import {UniformBuffer} from "../../buffer/uniform";
import {device} from "../../global";

export class KeepDistance {

    canvas: HTMLCanvasElement;
    uniform: UniformBuffer;
    context: GPUCanvasContext;

    async start() {
        this.init();
    }

    setCanvasSize = () => {
        this.canvas.width = window.innerWidth * devicePixelRatio;
        this.canvas.height = window.innerHeight * devicePixelRatio;

        const ar = this.canvas.width / this.canvas.height;

        this.uniform.data.viewMatrix = mat4.ortho(-ar, ar, -1, 1, -1, 1);
    }

    setMousePosition = (event) => {

        let mouseX = event.clientX;
        let mouseY = event.clientY;

        let normalizedX = (mouseX / window.innerWidth) * 2 - 1;
        let normalizedY = -((mouseY / window.innerHeight) * 2 - 1);

        let aspectRatio = window.innerWidth / window.innerHeight;
        normalizedX *= aspectRatio;

        this.uniform.data.blub[0] = normalizedX;
        this.uniform.data.blub[1] = normalizedY;
    }

    onmousedown = () => {
        this.uniform.data.blub[3] = this.uniform.data.blub[3] ? 0 : 1;
        console.log(this.uniform.data.blub[3])
    }

    init() {

        this.uniform = new UniformBuffer({
            viewMatrix: mat4.create(),
            blub: vec4.create()
        });

        this.canvas = document.getElementsByTagName("canvas")[0];
        this.setCanvasSize();
        window.addEventListener("resize", this.setCanvasSize);
        window.addEventListener("mousemove", this.setMousePosition);
        window.addEventListener("mousedown", this.onmousedown);

        this.context = this.canvas.getContext('webgpu') as GPUCanvasContext;
        const presentationFormat = navigator.gpu.getPreferredCanvasFormat();

        this.context.configure({
            device: device,
            format: presentationFormat,
            alphaMode: 'premultiplied',
        });

    }
}