export const isSystemAdmin = (user: Express.User) => {
  return !!user.localProfile?.isSystemAdmin;
};
