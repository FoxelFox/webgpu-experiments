import {mat4, vec2, vec3, vec4} from "wgpu-matrix";
import {UniformBuffer} from "../../data/uniform";
import {device} from "../../global";
import p5 from 'p5';
import vertexTextureQuad from "./screen-quad.wgsl";
import debug from "./debug.wgsl";
import {Physics} from "./physics";
import {MultipleBuffer} from "../../data/multiple-buffer";
import {Distance} from "./distance";
import {Debug} from "./debug";
import {DrawParticles} from "./draw-particles";

export class KeepDistance {

    canvas: HTMLCanvasElement

    uniform: UniformBuffer
    context: GPUCanvasContext
    texture: GPUTexture
    particles: MultipleBuffer

    t = 0
    zoom = 1
    movedX = 0
    movedY = 0
    mouseDownPositionX = 0
    mouseDownPositionY = 0
    mouseDownMovedX = 0
    mouseDownMovedY = 0

    debugMode: boolean = false

    difficulty: number = 1
    numParticles = 1024 * 64

    physics: Physics
    distance: Distance
    debug: Debug
    drawParticles: DrawParticles

    async start() {
        this.init();
        await this.update();


        let difficulty = 1;
        let difficultyIncrease = 1;
        let before = Date.now();
        let fps = 60;
        let score = 0;

        const loop = async () => {

            await device.queue.onSubmittedWorkDone();
            await this.update();

            const now = Date.now();
            const time = now - before;
            before = now;

            fps = 1000 / time;

            if (fps > 60 && difficulty < 1 && this.uniform.data.mouse[3] === 0) {
                difficulty += difficultyIncrease;
                this.setDifficulty(difficulty);
                score = 0;

                if (difficulty == 100) {
                    difficultyIncrease = 1;
                }

            }

            if (this.uniform.data.mouse[3] === 0) {
                score = (score * 24 + Math.pow((difficulty / 100) * fps, 2)) / 25;
            }

            document.getElementById("score").innerHTML = `FPS ${fps.toFixed(0)}`

            requestAnimationFrame(loop);
        }
        await loop();
    }

    calculateInitialVelocity(x: number, y: number, angularVelocity: number, noise: p5): { x: number, y: number } {
        const noiseScale = 10;

        angularVelocity += (noise.noise(x * noiseScale, y * noiseScale) - 0.5) * 2 * 0.005;
        // Berechne den Abstand zum Zentrum der Galaxie
        const r = Math.sqrt(x * x + y * y);

        // Berechne die Richtung der Geschwindigkeit, die senkrecht zur Verbindungslinie zum Zentrum stehen soll
        const theta = Math.atan2(y, x) + Math.PI / 2;

        // Setze die Geschwindigkeit und gebe sie als ein 2D-Vector zurück
        const vx = angularVelocity * (r) * Math.cos(theta)
        const vy = angularVelocity * (r) * Math.sin(theta)

        //return {x: vx, y: vy};
        return {x: 0, y: 0};
    }

    generateRandomParticle(radius: number, noise: p5): { x: number, y: number } {
        // Wähle den Radius und den Winkel zufällig aus
        const r = Math.sqrt(Math.random()) * radius;
        const theta = Math.random() * 2 * Math.PI;

        // Berechne die kartesischen Koordinaten
        const x = r * Math.cos(theta);
        const y = r * Math.sin(theta);

        return {x, y};
    }

    updateCamera = () => {
        this.canvas.width = window.innerWidth * devicePixelRatio;
        this.canvas.height = window.innerHeight * devicePixelRatio;

        const ar = this.canvas.width / this.canvas.height;

        this.uniform.data.viewMatrix = mat4.ortho(-ar, ar, -1, 1, -1, 1);
        this.uniform.data.viewMatrix = mat4.scale(this.uniform.data.viewMatrix, vec3.create(this.zoom,this.zoom,1))
        this.uniform.data.viewMatrix = mat4.translate(this.uniform.data.viewMatrix, vec3.create(this.movedX,this.movedY,1));
    }

    setMousePosition = (event: MouseEvent) => {

        let mouseX = event.clientX;
        let mouseY = event.clientY;

        let normalizedX = (mouseX / window.innerWidth) * 2 - 1;
        let normalizedY = -((mouseY / window.innerHeight) * 2 - 1);

        let aspectRatio = window.innerWidth / window.innerHeight;
        normalizedX *= aspectRatio;

        if (this.uniform.data.mouse[3]) {
            console.log(mouseX - this.mouseDownPositionX)
            // mouse down, move camera
            this.movedX = this.mouseDownMovedX + (mouseX  - this.mouseDownPositionX) / window.innerWidth * 2 * aspectRatio / this.zoom;
            this.movedY = this.mouseDownMovedY + (-mouseY + this.mouseDownPositionY) / window.innerHeight * 2  / this.zoom;
        }

        this.uniform.data.mouse[0] = (normalizedX / this.zoom - this.movedX);
        this.uniform.data.mouse[1] = (normalizedY / this.zoom - this.movedY);

    }

    onmousedown = (event: MouseEvent) => {
        this.mouseDownPositionX = event.clientX;
        this.mouseDownPositionY = event.clientY;
        this.mouseDownMovedX = this.movedX;
        this.mouseDownMovedY = this.movedY;
        this.uniform.data.mouse[3] = this.uniform.data.mouse[3] ? 0 : 1;
    }

    onmouseup = () => {
        this.uniform.data.mouse[3] = this.uniform.data.mouse[3] ? 0 : 1;
    }

    onKeydown = (event: KeyboardEvent) => {
        if (event.code === "KeyD") {
            this.debugMode = !this.debugMode
        }
    }

    onWheel = (event: WheelEvent) => {
        this.zoom *= 1 - event.deltaY * 0.001;
    }

    init() {

        // data
        this.uniform = new UniformBuffer({
            viewMatrix: mat4.create(),
            mouse: vec4.create()
        });

        this.texture = device.createTexture({
            size: [4096, 4096],
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
            format: 'rgba32float',
        });

        this.particles = new MultipleBuffer(2);

        // context
        this.canvas = document.getElementsByTagName("canvas")[0];
        this.updateCamera();

        this.context = this.canvas.getContext('webgpu') as GPUCanvasContext;
        const presentationFormat = navigator.gpu.getPreferredCanvasFormat();

        this.context.configure({
            device: device,
            format: presentationFormat,
            alphaMode: 'premultiplied',
        });


        // pipelines
        this.physics = new Physics(this);
        this.distance= new Distance(this);
        this.debug = new Debug(this);
        this.drawParticles = new DrawParticles(this);

        // other stuff
        this.setDifficulty(4095);
        //this.setDifficulty(1024);

        window.addEventListener("resize", this.updateCamera);
        window.addEventListener("mousemove", this.setMousePosition);
        window.addEventListener("mousedown", this.onmousedown);
        window.addEventListener("mouseup", this.onmouseup);
        window.addEventListener("keydown", this.onKeydown);
        window.addEventListener("wheel", this.onWheel);
    }

    setDifficulty(difficulty: number) {
        this.difficulty = difficulty;
        this.numParticles = 1024 * difficulty;

        const initialParticleData = new Float32Array(this.numParticles * 6);
        const noise = new p5();
        for (let i = 0; i < this.numParticles; ++i) {
            const p = this.generateRandomParticle(1, noise);
            const v = this.calculateInitialVelocity(p.x, p.y, -0.015, noise);

            initialParticleData[6 * i + 0] = p.x;
            initialParticleData[6 * i + 1] = p.y;
            initialParticleData[6 * i + 2] = v.x + (Math.random() - 0.5) * 0.0001;
            initialParticleData[6 * i + 3] = v.y + (Math.random() - 0.5) * 0.0001;
            initialParticleData[6 * i + 4] = 0;
            initialParticleData[6 * i + 5] = 0;
        }

        this.particles.update(initialParticleData);
        this.physics.updateBindGroup(this.particles, this.uniform);
    }

    update = async () => {
        this.updateCamera();
        this.uniform.data.mouse[2] = this.difficulty;
        this.uniform.update();
        const commandEncoder = device.createCommandEncoder();

        this.physics.update(commandEncoder);
        this.distance.update(commandEncoder);

        if (this.debugMode) {
            this.debug.update(commandEncoder);
        } else {
            this.drawParticles.update(commandEncoder);
        }

        ++this.t;
        device.queue.submit([commandEncoder.finish()]);
    }

    get activeParticleBuffer(): GPUBuffer {
        return this.particles.buffers[(this.t + 1) % 2];
    }
}