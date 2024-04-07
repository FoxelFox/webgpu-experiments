export class Import {
    constructor() {

    }

    async start() {
        await this.streamCSV("/resources/resultrules.csv")
    }

    async streamCSV(url: string) {
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
        let rows: string[] = [];

        while (true) {
            const { done, value } = await stream.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            const lines = buffer.split('\n');

            // Save the last incomplete line for the next iteration
            buffer = lines.pop() || '';

            // Process complete lines
            rows.push(...lines);

            console.log(lines.length);
        }
    }
}