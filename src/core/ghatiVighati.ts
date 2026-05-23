/**
 * Traditional Indian time since sunrise (panchānga / patrikā style).
 * 1 ghaṭī = 24 minutes; 1 vighaṭī = 24 seconds (60 vighaṭī = 1 ghaṭī).
 */
export const ghatiVighatiSinceSunrise = (
  birthUtc: Date,
  sunriseUtc: Date
): { ghati: number; vighati: number } => {
  const ms = Math.max(0, birthUtc.getTime() - sunriseUtc.getTime());
  const totalVighati = Math.floor(ms / 24_000);
  return {
    ghati: Math.floor(totalVighati / 60),
    vighati: totalVighati % 60
  };
};
