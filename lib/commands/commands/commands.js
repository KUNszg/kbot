const commands = async ({}, { Commons }) => {
  const responses = Commons.ResponseRepository().getResponses();

  return {
    response: responses.COMMANDS.SUCCESS.LIST
  };
};

module.exports.invocation = commands;
