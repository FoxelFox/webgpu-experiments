import {greet} from "../pkg";
greet()

import {ParticleSystem} from "./blub/particle-system";
import {device, init} from "./global";
import {Grid} from "./blub/grid/grid";

async function main() {


	await init();

	const grid = new Grid();
	const blub = new ParticleSystem();

	blub.init();

	grid.run();
	await grid.readFromGPU();

	const loop = async () => {

		await device.queue.onSubmittedWorkDone();

		// loop

		requestAnimationFrame(loop);

	}

	await loop();
}

main().then();
