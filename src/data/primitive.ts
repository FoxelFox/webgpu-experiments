import {device} from "../global";

export function quad(size?: number) {
	if (size === undefined) {
		size = 1;
	}

	const quadVertexBuffer = device.createBuffer({
		size: 6 * 2 * 4, // 6x vec2<f32>
		usage: GPUBufferUsage.VERTEX,
		mappedAtCreation: true,
	});

	const vertexData = [
		-size, -size, +size, -size, -size, +size, -size, +size, +size, -size, +size, +size,
	];
	new Float32Array(quadVertexBuffer.getMappedRange()).set(vertexData);
	quadVertexBuffer.unmap();

	return quadVertexBuffer;
}
