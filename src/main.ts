import {Blub} from "./blub/blub";
import {device} from "./global";


async function main() {
	const blub = new Blub();
	await blub.init();



	let difficulty = 1;
	let warmup = false;

	let before = Date.now();
	let fps = 60;
	let score = 0;

	const loop = async () => {

		if (warmup) {

			document.getElementById("info").innerHTML = `Warmup checking GPU capabilities using ${difficulty * 1024} Particles`

			before = Date.now();
			for (let frames = 0; frames < 1; ++frames) {
				await blub.update();
			}

			await device.queue.onSubmittedWorkDone();

			const now = Date.now();
			const time = now - before;


			console.log(time);



			if(time > 1000/(20) && difficulty > 5) {
				warmup = false;
				difficulty = Math.floor(Math.max(1, difficulty / 2.25));
				blub.setDifficulty(difficulty);
			} else {
				++difficulty;
			}

			blub.setDifficulty(difficulty);



		} else {


			await device.queue.onSubmittedWorkDone();
			await blub.update();


			const now = Date.now();
			const time = now - before;
			before = now;

			fps = 1000/time;

			if (fps > 60) {
				blub.setDifficulty(++difficulty);
				score = 0;
			}

			score = Math.max(Math.pow(difficulty/100 * fps, 2), score);

			document.getElementById("info").innerHTML = `Your GPU can handle ${difficulty * 1024} Particles when targeting 60 FPS`
			document.getElementById("score").innerHTML = `Benchmark Score ${score.toFixed(0)}`




		}

		requestAnimationFrame(loop);


	}

	await loop();

}



main().then();
