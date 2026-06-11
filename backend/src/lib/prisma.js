// prisma.js — the one and only PrismaClient. Every route imports this single
// instance; each PrismaClient opens its own connection pool, and Postgres
// has opinions about how many of those one small drone company needs.

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default prisma;
