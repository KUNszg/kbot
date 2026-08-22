const website = async ({}, { Commons }) => {
  const responses = Commons.ResponseRepository().getResponses();

  return {
    response: responses.WEBSITE.SUCCESS.URL
  };
};

module.exports.invocation = website;
