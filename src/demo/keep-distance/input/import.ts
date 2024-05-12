import {vec3} from "wgpu-matrix";

export class Import {

    maxEdges = 0;
    maxForce = 0;
    index: number = 0;
    items;
    map = {}
    indexToId = [];


    settings: {
        colors: any
        maxEdges: number
        nodes: number
        data: any
        Size: number
        items: any
    } = {} as any;

    constructor() {

    }

    async start() {
        const res = await fetch("./resources/items.json");
        this.items = await res.json();
        await this.streamCSV("./resources/resultrules.csv");
    }

    private async streamCSV(url: string) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Failed to fetch CSV file');
        }

        // Create a ReadableStream from the response body
        const stream = response.body?.getReader();

        if (!stream) {
            throw new Error('Failed to get stream from response body');
        }

        // Read and process the CSV data line by line
        let decoder = new TextDecoder();
        let buffer = '';
        let first = true;
		let count = 0;

        while (true) {
            const { done, value } = await stream.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            let lines = buffer.split('\n');

            if (first) {
                // ignore csv header
                lines = lines.splice(1);
                first = false;
            }

            // Save the last incomplete line for the next iteration
            buffer = lines.pop() || '';

            // Process complete lines
            this.parseConnections(lines);
			count += lines.length;

			document.getElementById("score").innerHTML = `Loading ${count} Connections ...`
        }

        const data = [];
        const test = [];
        let missingData = 0;
        // TODO
        let base = Math.sqrt(Object.keys(this.map).length);
        if (base % 1 !== 0) {
            base = this.nextPo2(base);
        }

        if (!this.isPo2(this.maxEdges)) {
            this.maxEdges = this.nextPo2(this.maxEdges);
        }

        const colors = [];
        const filteredItems = {};
        for (const key in this.map) {
            filteredItems[key] = this.items[key];

            const edges = [];
            for (const edge of this.map[key].edges) {
                if (this.map[edge.conc]) { // check was needed for some data sets
                    const index: number = this.map[edge.conc].id;
                    let y = Math.floor(index / base);
                    let x = index % base;
                    edges.push([x, y, edge.force, 0])
                }
            }

            if (edges.length === 0) {
                missingData++;
            }

            // padding
            for (let p = edges.length; p < this.maxEdges; p++) {
                edges.push([-1, -1, -1, 0]);
            }
            data[this.map[key].id] = edges;
            this.indexToId[this.map[key].id] = key;
        }

        let buf = [];
        let i = 0;
        for (const node of data) {

            const item = this.items[this.indexToId[i]];
            if (item) {
				item.color.push(255);
                colors.push(...this.fixDarkColors(item.color));
            } else {
                // not in items.json use default color
                colors.push(...[255,255,255, 255]);
            }


            for (const edge of node) {
                buf.push(...edge);
            }

            i++;
        }

        console.log("Missing Data: ", missingData);
        console.log("Nodes: ", Object.keys(this.map).length);
        console.log("Size: ", base);
        console.log("Max. edges: ", this.maxEdges);

		// WebGPU wants the exact byte length for a full sized texture
        colors.length = base * base * 4;
        buf.length = base * base * this.maxEdges * 4; 

        console.log("buf len1", base * base * this.maxEdges)

        this.settings.colors = colors;
        this.settings.maxEdges = this.maxEdges;
        this.settings.nodes = Object.keys(this.map).length;
        this.settings.data = buf;
        this.settings.Size = base;
        this.settings.items = filteredItems;
    }

    private parseConnections(lines: string[]) {
        for (let i = 1; i < lines.length; ++i) {
            const v = lines[i].split("|");

            // filter missing items
            if (!this.items[v[0]] || !this.items[v[1]]) {
                continue;
            }

			// filter self references
			if (v[0] === v[1]) {
				continue;
			}

            let prem;
            if (this.map[v[0]]) {
                prem = this.map[v[0]];
            } else {
                prem = this.map[v[0]] = {id: this.index++, edges: []};
            }


            const force = parseFloat(v[2]);

            if (this.maxForce < force) {
                this.maxForce = force < 500 ? force : this.maxForce;
            }

            prem.edges.push({
                conc: v[1],
                force: force
            });

            if (this.maxEdges < prem.edges.length) {
                this.maxEdges++;
            }
        }
    }

    private nextPo2(n: number) {
        let i = 0;
        while (n >= Math.pow(2, i)) {
            i++;
        }

        return Math.pow(2, i);
    }

    private isPo2(v): boolean {
        return v && !(v & (v - 1));
    }


    private fixDarkColors(color: number[]) {
        const c = vec3.fromValues(color[0], color[1], color[2]);
        if (vec3.length(c) < 128.0) {
            return [96, 96, 96, 255];
        }
        return  color;
    }
}