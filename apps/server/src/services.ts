import { createAuth } from "@mini-ticket-tracker/auth";
import { createDb } from "@mini-ticket-tracker/db";

import { ENV } from "./env.server";

export const db = createDb(ENV);
export const auth = createAuth(ENV, db);
