import {greet} from "../pkg";
greet()

import {ParticleSystem} from "./blub/particle-system";
import {device, init} from "./global";
import {Grid} from "./blub/grid/grid";

async function main() {


	await init();


	const particleSystem = new ParticleSystem();
	particleSystem.init();

	particleSystem.setDifficulty(1);
	await particleSystem.update();


	let difficulty = 1;
	let difficultyIncrease = 1;
	let before = Date.now();
	let fps = 60;
	let score = 0;


	const loop = async () => {

		await device.queue.onSubmittedWorkDone();
		await particleSystem.update();

		const now = Date.now();
		const time = now - before;
		before = now;

		fps = 1000 / time;

		if (fps > 60 && difficulty < 200 && particleSystem.uniform.data.blub[3] === 0) {
			difficulty += difficultyIncrease;
			particleSystem.setDifficulty(difficulty);
			score = 0;

			if (difficulty == 100) {
				difficultyIncrease = 1;
			}

		}

		if (particleSystem.uniform.data.blub[3] === 0) {
			score = (score * 24 + Math.pow((difficulty / 100) * fps, 2)) /25;
		}

		//document.getElementById("info").innerHTML = `Your GPU can handle ${difficulty * 1024} Particles when targeting 60 FPS`
		document.getElementById("score").innerHTML = `Benchmark Score ${score.toFixed(0)}`

		requestAnimationFrame(loop);

	}

	await loop();
}

main().then();
