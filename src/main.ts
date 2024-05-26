import {greet} from "../pkg";
//console.log(greet)

import {Galaxy} from "./demo/galaxy/galaxy";
import {init} from "./global";
import {KeepDistance} from "./demo/keep-distance/keep-distance";
import {Terrain} from "./demo/terrain/terrain";

enum Demo {
	Galaxy,
	KeepDistance,
	Terrain,
}

const activeDemo: Demo = Demo.Terrain;

async function main() {
	await init();

	switch (activeDemo) {
		case Demo.Galaxy:
			await new Galaxy().start();
			break;
		case Demo.KeepDistance:
			await new KeepDistance().start();
			break;
		case Demo.Terrain:
			await new Terrain().start();
			break;
	}
}

await main();
