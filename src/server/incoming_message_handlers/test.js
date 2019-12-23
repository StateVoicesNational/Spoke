export const processMessage = async messageInstance => {
  console.log(
    `message handler test received message ${JSON.stringify(
      messageInstance,
      " ",
      2
    )}`
  );
  return true;
};
