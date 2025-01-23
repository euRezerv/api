export const useFakeDateAsync = async (
  newDate: Date,
  callbackFn: () => Promise<void>,
  config: Parameters<typeof jest.useFakeTimers>[0] = { doNotFake: ["nextTick", "setImmediate"] }
) => {
  jest.useFakeTimers(config).setSystemTime(newDate);

  try {
    await callbackFn();
  } finally {
    jest.useRealTimers();
  }
};
