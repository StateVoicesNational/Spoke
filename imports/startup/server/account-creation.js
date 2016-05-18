Accounts.onCreateUser((options, user) => {
  const { firstName, lastName } = options
  user.firstName = firstName
  user.lastName = lastName

  return user
})
