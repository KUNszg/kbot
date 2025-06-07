const unregister = async (context, { Commons }) => {
  const responses = Commons.ResponseRepository().getResponses();

  return {
    response: responses.REGISTER.SUCCESS.UNREGISTER_LINK
  };
};

module.exports.invocation = unregister;
