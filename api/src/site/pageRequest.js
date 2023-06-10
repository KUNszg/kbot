const pageRequest = services => {
  const { app } = services;

  app.get('/request', async (req, res) => {
    const html = `<!DOCTYPE html><html lang="en">Coming soon...</html>`;

    res.send(html);
  });
};

module.exports = pageRequest;
