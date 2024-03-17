import {greet} from "../pkg";
greet()

import {Galaxy} from "./demo/galaxy/galaxy";
import {init} from "./global";

async function main() {
	await init();
	await new Galaxy().start();
}

main().then();
