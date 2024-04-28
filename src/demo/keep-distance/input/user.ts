import {KeepDistance} from "../keep-distance";
import {mat4, vec3} from "wgpu-matrix";

export class User {
    zoom = 1
    movedX = 0
    movedY = 0
    mouseDownPositionX = 0
    mouseDownPositionY = 0
    mouseDownMovedX = 0
    mouseDownMovedY = 0
    debugMode: boolean = false
	mouseX: number = 0
	mouseY: number = 0
	mouseDown: boolean = false
	pause: boolean = false

    constructor(private demo: KeepDistance) {
		const canvas = document.getElementsByTagName("canvas")[0];
		canvas.addEventListener("resize", this.updateCamera);
		canvas.addEventListener("mousemove", this.setMousePosition);
		canvas.addEventListener("mousedown", this.onmousedown);
		canvas.addEventListener("mouseup", this.onmouseup);
		window.addEventListener("keydown", this.onKeydown);
		canvas.addEventListener("wheel", this.onWheel);
		document.getElementById("pause").onclick = this.togglePause;
    }

	togglePause = () => {
		this.pause = !this.pause;
		document.getElementById("pause").innerHTML = this.pause ? "resume" : "pause"
	}

    updateCamera = () => {
        this.demo.canvas.width = window.innerWidth * devicePixelRatio;
        this.demo.canvas.height = window.innerHeight * devicePixelRatio;

        const ar = this.demo.canvas.width / this.demo.canvas.height;

        this.demo.uniform.data.viewMatrix = mat4.ortho(-ar, ar, -1, 1, -1, 1);
        this.demo.uniform.data.viewMatrix = mat4.scale(this.demo.uniform.data.viewMatrix, vec3.create(this.zoom,this.zoom,1))
        this.demo.uniform.data.viewMatrix = mat4.translate(this.demo.uniform.data.viewMatrix, vec3.create(this.movedX,this.movedY,1));
    }

    setMousePosition = (event: MouseEvent) => {

        this.mouseX = event.clientX;
		this.mouseY = event.clientY;

        let normalizedX = (this.mouseX / window.innerWidth) * 2 - 1;
        let normalizedY = -((this.mouseY / window.innerHeight) * 2 - 1);

        let aspectRatio = window.innerWidth / window.innerHeight;
        normalizedX *= aspectRatio;

        if (this.demo.uniform.data.mouse[3]) {
            // mouse down, move camera
            this.movedX = this.mouseDownMovedX + (this.mouseX  - this.mouseDownPositionX) / window.innerWidth * 2 * aspectRatio / this.zoom;
            this.movedY = this.mouseDownMovedY + (-this.mouseY + this.mouseDownPositionY) / window.innerHeight * 2  / this.zoom;
        }

        this.demo.uniform.data.mouse[0] = (normalizedX / this.zoom - this.movedX);
        this.demo.uniform.data.mouse[1] = (normalizedY / this.zoom - this.movedY);

    }

    onmousedown = (event: MouseEvent) => {
        this.mouseDownPositionX = event.clientX;
        this.mouseDownPositionY = event.clientY;
        this.mouseDownMovedX = this.movedX;
        this.mouseDownMovedY = this.movedY;
        this.demo.uniform.data.mouse[3] = 1;
		this.mouseDown = true;
    }

    onmouseup = () => {
        this.demo.uniform.data.mouse[3] = 0;
		this.mouseDown = false;
    }

    onKeydown = (event: KeyboardEvent) => {
        if (event.code === "KeyD") {
            this.debugMode = !this.debugMode


			document.getElementById("info")
				.setAttribute("hidden", this.debugMode.toString());

        }
    }

    onWheel = (event: WheelEvent) => {
        this.zoom *= 1 - event.deltaY * 0.001;
    }

}