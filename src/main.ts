import {greet} from "../pkg";
greet()

import {Blub} from "./blub/blub";
import {device, init} from "./global";
import {Grid} from "./blub/grid/grid";

async function main() {


	await init();

	const grid = new Grid(4);

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
