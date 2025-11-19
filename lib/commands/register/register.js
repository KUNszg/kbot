const register = async (context, { Commons }) => {
  const responses = Commons.ResponseRepository().getResponses();

  return {
    response: responses.REGISTER.SUCCESS.REGISTER_LINK
  };
};

module.exports.invocation = register;
