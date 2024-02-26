const refreshModuleStats = async kb => {
  const modules = await kb.sqlClient.query('SELECT * FROM stats');

  if (!modules) {
    throw new Error("MySql connection error: query on table 'stats' returned no data");
  }

  await kb.redisClient.set(
    'kb:global:stats',
    modules,
    1e8
  );
};

module.exports = refreshModuleStats;
