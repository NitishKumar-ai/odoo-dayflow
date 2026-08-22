/** Side-effect import: makes .env.local available to standalone scripts. */
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());
