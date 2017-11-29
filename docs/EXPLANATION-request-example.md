# Lifecycle of a request

This traces an example in the code of how different parts are linked together.

The example comes from the 'first' step, which is consuming an invite code, to login.

## Connecting to /invite/abc-123

1. Loaded from [`src/server/index.js`](../src/server/index.js) (`app.use(appRenderer)`)
   => [`src/server/middleware/app-renderer.jsx`](../src/server/middleware/app-renderer.jsx) (`const routes = makeRoutes(authCheck)`)
   => [`src/routes.jsx`](../src/routes.jsx)
you will see `<Route path='invite/:inviteId' component={CreateOrganization} ...`

2. This loads [`src/containers/CreateOrganization.jsx`](../src/containers/CreateOrganization.jsx)

3. which while loading calls `inviteData` and `userData` which will call `getInvite` and `getCurrentUser` through graphql api

4. The client then makes an xmlhttprequest to `/graphql` with the following payload:
```
{"debugName":"___composed","query":"query ___composed($___getInvite___requestIndex_0___inviteId: String!) {\n  ___getInvite___requestIndex_0___fieldIndex_0: invite(id: $___getInvite___requestIndex_0___inviteId) {\n    id\n    isValid\n  }\n  ___getCurrentUser___requestIndex_1___fieldIndex_0: currentUser {\n    id\n  }\n}\n","variables":{"___getInvite___requestIndex_0___inviteId":"abc-123"}}
```

5. GraphQL 'schema' is defined in [`src/server/api/schema.js`](../src/server/api/schema.js) where you will see `currentUser` and `invite` defined there.  Those definitions *magically* (via `type RootQuery` in that file) make `getCurrentUser` and `getInvite` exist.  See `rootResolvers = `... in the file for the code that will run on e.g. `getInvite` under the `invite:` key.

6. After authenticating the user with authRequired(user), it "loads" the invite.  The first argument of `load(id)` is presumed to map to the id field, because TKTK??? probably it's defined through [`src/server/api/invite.js`](../src/server/api/invite.js)

7. Assuming that an invite is found with id=abc-123 and the user is authenticated, the graphql returns this info to the client.

8. Back in `CreateOrganization.jsx`, with the data now loaded, React renders the container, which runs `renderForm()` and displays the form to create an organization to the user.

9. When the user fills out the organization name field and clicks submit, it then runs `onSubmit` for the GSForm and calls `mutations.createOrganization` with the form values as arguments, again through GraphQL.

10. We circle back (through another XHR request go /graphql) into [`src/server/api/schema.js`](../src/server/api/schema.js) and call `createOrganization` with the same arguments listed in the jsx file.

11. In schema.js `rootMutations` has a `createOrganization` method which is called and it runs (after revalidating the invite id and user) `Organization.save(...)` -- Organization, in this case is a *model* (see the import at the top) and is defined in [`src/server/models/organization.js`](../src/server/models/organization.js).

