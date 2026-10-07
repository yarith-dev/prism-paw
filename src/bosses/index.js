import { StreetSweeper } from './sweeper.js';
import { WeedWhacker } from './whacker.js';
import { NetTrawler } from './trawler.js';
import { Echo } from './echo.js';
import { Curator } from './curator.js';

/** Level def `boss` key → boss class. */
export const BOSSES = { sweeper: StreetSweeper, whacker: WeedWhacker, trawler: NetTrawler, echo: Echo, curator: Curator };
