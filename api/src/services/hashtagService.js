import db from "../models/index.js";
const { Hashtag, ReelHashtag } = db;

export const getHashtagsService = async (query = "") => {
  return await Hashtag.findAll({
    where: db.Sequelize.where(
      db.Sequelize.fn("LOWER", db.Sequelize.col("name")),
      "LIKE",
      `%${query.toLowerCase()}%`
    ),
    limit: 10,
  });
};

export const linkHashtagsToReelService = async (idReel, hashtags = []) => {
    if (!idReel || !hashtags.length) return { linkedCount: 0 };
    
    let linkedCount = 0;
    for (const name of hashtags) {
        // 1. Tìm hoặc tạo Hashtag
        const [tag] = await Hashtag.findOrCreate({ where: { name: name.toLowerCase() } }); 
        
        // 2. Tạo liên kết ReelHashtag
        const [, created] = await ReelHashtag.findOrCreate({
            where: { idReel, idHashtag: tag.idHashtag },
        });
        
        if (created) {
            linkedCount++;
        }
    }
    
    return { linkedCount };
};

export const getTopHashtagsService = async () => {
  const [results] = await db.sequelize.query(`
    SELECT 
      h.idHashtag,
      h.name,
      COUNT(rh.idReel) AS usageCount
    FROM hashtags h
    LEFT JOIN reel_hashtags rh ON h.idHashtag = rh.idHashtag
    GROUP BY h.idHashtag, h.name
    ORDER BY usageCount DESC
    LIMIT 10;
  `);

  return results;
};
