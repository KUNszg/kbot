const healthcheckGet = services => {
  const { app } = services;
  app.get('/healthcheck', (req, res) => {
    res.status(200).send("OK");
  });
}

module.exports = healthcheckGet;
