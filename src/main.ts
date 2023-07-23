import {greet} from "../pkg";
greet()

import {ParticleSystem} from "./blub/particle-system";
import {device, init} from "./global";
import {Grid} from "./blub/grid/grid";

async function main() {


	await init();


	const particleSystem = new ParticleSystem();
	particleSystem.init();

	particleSystem.setDifficulty(8);
	await particleSystem.update()

	const loop = async () => {

		await device.queue.onSubmittedWorkDone();

		// loop
		setTimeout(async () => {
			await particleSystem.update();

			requestAnimationFrame(loop);
		}, 1000);


	}

	await loop();
}

main().then();
