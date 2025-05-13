const unregister = async (context, { kb, Commons }) => {
  const responses = Commons.ResponseRepository().getResponses();
};

module.exports.invocation = unregister;
