const randomEmoteGet = services => {
  const { app, Commons } = services;

  app.get('/randomemote', async (req, res) => {
    const randomemote = await Commons.ServiceConnector.Connector.sqlClient.query(`
        SELECT *
        FROM emotes
        ORDER BY RAND()
        LIMIT 3`);

    res.send([
      { emote: randomemote[0].emote, emoteUrl: randomemote[0].url },
      { emote: randomemote[1].emote, emoteUrl: randomemote[1].url },
      { emote: randomemote[2].emote, emoteUrl: randomemote[2].url },
    ]);
  });
};

module.exports = randomEmoteGet;
