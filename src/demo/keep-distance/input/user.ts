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

    constructor(private demo: KeepDistance) {
        window.addEventListener("resize", this.updateCamera);
        window.addEventListener("mousemove", this.setMousePosition);
        window.addEventListener("mousedown", this.onmousedown);
        window.addEventListener("mouseup", this.onmouseup);
        window.addEventListener("keydown", this.onKeydown);
        window.addEventListener("wheel", this.onWheel);
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

        let mouseX = event.clientX;
        let mouseY = event.clientY;

        let normalizedX = (mouseX / window.innerWidth) * 2 - 1;
        let normalizedY = -((mouseY / window.innerHeight) * 2 - 1);

        let aspectRatio = window.innerWidth / window.innerHeight;
        normalizedX *= aspectRatio;

        if (this.demo.uniform.data.mouse[3]) {
            console.log(mouseX - this.mouseDownPositionX)
            // mouse down, move camera
            this.movedX = this.mouseDownMovedX + (mouseX  - this.mouseDownPositionX) / window.innerWidth * 2 * aspectRatio / this.zoom;
            this.movedY = this.mouseDownMovedY + (-mouseY + this.mouseDownPositionY) / window.innerHeight * 2  / this.zoom;
        }

        this.demo.uniform.data.mouse[0] = (normalizedX / this.zoom - this.movedX);
        this.demo.uniform.data.mouse[1] = (normalizedY / this.zoom - this.movedY);

    }

    onmousedown = (event: MouseEvent) => {
        this.mouseDownPositionX = event.clientX;
        this.mouseDownPositionY = event.clientY;
        this.mouseDownMovedX = this.movedX;
        this.mouseDownMovedY = this.movedY;
        this.demo.uniform.data.mouse[3] = this.demo.uniform.data.mouse[3] ? 0 : 1;
    }

    onmouseup = () => {
        this.demo.uniform.data.mouse[3] = this.demo.uniform.data.mouse[3] ? 0 : 1;
    }

    onKeydown = (event: KeyboardEvent) => {
        if (event.code === "KeyD") {
            this.debugMode = !this.debugMode
        }
    }

    onWheel = (event: WheelEvent) => {
        this.zoom *= 1 - event.deltaY * 0.001;
    }

}