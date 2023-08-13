const got = require("got");

test("ChannelsGet_WhenQueried_Returns200StatusCode", async () => {
  const channelsGet = await got("http://localhost:8080/api/channels");

  console.log(channelsGet)
});