import {greet} from "../pkg";
greet()


import {Blub} from "./blub/blub";
import {device} from "./global";

async function main() {
	const blub = new Blub();
	await blub.init();

	let difficulty = 1;
	let before = Date.now();
	let fps = 60;
	let score = 0;

	const loop = async () => {

		await device.queue.onSubmittedWorkDone();
		await blub.update();

		const now = Date.now();
		const time = now - before;
		before = now;

		fps = 1000 / time;

		if (fps > 60) {
			blub.setDifficulty(++difficulty);
			score = 0;
		}

		score = Math.max(Math.pow((difficulty / 100) * fps, 2), score);

		document.getElementById("info").innerHTML = `Your GPU can handle ${difficulty * 1024} Particles when targeting 60 FPS`
		document.getElementById("score").innerHTML = `Benchmark Score ${score.toFixed(0)}`

		requestAnimationFrame(loop);
	}

	await loop();
}

main().then();
