Accounts.onCreateUser((options, user) => {
  const { firstName, lastName, cell } = options
  user.firstName = firstName
  user.lastName = lastName
  user.cell = cell
  return user
})
