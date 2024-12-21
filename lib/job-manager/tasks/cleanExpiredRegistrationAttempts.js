const cleanExpiredRegistrationAttempts = async kb => {
  await kb.sqlClient.query(`
    DELETE FROM access_token
    WHERE platform="spotify"
      AND date < now() - interval 15 MINUTE
      AND user IS NULL
      AND code != "Resolved"`);

  await kb.sqlClient.query(`
    DELETE FROM access_token
    WHERE platform="lastfm"
      AND date < now() - interval 15 MINUTE
      AND code != "lastfm"
      AND userName IS NULL`);

  await kb.sqlClient.query(`
    DELETE FROM access_token
    WHERE platform IS NULL
      AND DATE < now() - interval 15 MINUTE
      AND user IS NULL
      AND code != "Resolved"
      AND refresh_token IS NULL`);
};

module.exports = cleanExpiredRegistrationAttempts;
