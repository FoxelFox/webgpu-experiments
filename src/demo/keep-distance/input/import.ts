export class Import {

    maxEdges = 0;
    maxForce = 0;
    index: number = 0;
    map = {}
    indexToId = [];


    constructor() {

    }

    async start() {
        // const res = await fetch("/resources/items.json");
        // this.map = await res.json();
        await this.streamCSV("/resources/resultrules.csv");
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

        while (true) {
            const { done, value } = await stream.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            const lines = buffer.split('\n');

            // Save the last incomplete line for the next iteration
            buffer = lines.pop() || '';

            // Process complete lines
            this.parseConnections(lines);
            console.log(lines.length);
        }
    }

    private parseConnections(lines: string[]) {
        for (let i = 1; i < lines.length; ++i) {
            const v = lines[i].split("|");

            // filter missing items
            // TODO?
            // if (!items[v[0]] || !items[v[1]]) {
            //     continue;
            // }

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
}