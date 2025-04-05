import db from "@/db";
import { flareKeys, flares } from "@/db/schema";

//
export const getApiKeys = async () => await db.select().from(flareKeys);

export const getFlares = async () => await db.select().from(flares);
