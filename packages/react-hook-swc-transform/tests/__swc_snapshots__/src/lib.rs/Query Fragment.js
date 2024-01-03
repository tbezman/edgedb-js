export function SignInSignOutButton({ queryRef }: {
    queryRef: SignInSignOutButtonQueryFragmentRef;
}) {
    const [open, setOpen] = useQueryState("sign-in", parseAsBoolean);
    const { authedUser: user, users } = useQueryFragment(queryRef, e.queryFragment("SignInSignOutButtonQueryFragment", {
        users: e.select(e.User, (user)=>({
                ...UserListModalUserFragment(user)
            })),
        authedUser: e.select(e.User, (user)=>{
            return {
                id: true,
                name: true,
                filter_single: {
                    id: e.cast(e.uuid, e.param("userUuid", e.uuid))
                }
            };
        })
    }));
}
