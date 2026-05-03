#!/usr/bin/env bun
import { ConsoleController } from "./controllers/console/run";

const ctrl = new ConsoleController();
try {
	const result = await ctrl.run(process.argv.slice(2));
	console.log(result);
} catch (e: unknown) {
	const err = e as {
		userMessage?: string;
		rest?: () => { status: number; error: string; message: string };
	};
	if (typeof err.rest === "function") {
		const r = err.rest();
		console.error(`[${r.status}] ${r.error}: ${r.message}`);
		process.exit(1);
	}
	console.error(e);
	process.exit(1);
}
