import {greet} from "../pkg";
//console.log(greet)

import {Galaxy} from "./demo/galaxy/galaxy";
import {init} from "./global";
import {KeepDistance} from "./demo/keep-distance/keep-distance";

enum Demo {
	Galaxy,
	KeepDistance
}

const activeDemo: Demo = Demo.KeepDistance;

async function main() {
	await init();

	switch (activeDemo) {
		case Demo.Galaxy:
			await new Galaxy().start();
			break;
		case Demo.KeepDistance:
			await new KeepDistance().start();
			break;
	}
}

main().then();
