export function PostCard({ postRef }: PostCardProps) {
    const post = useFragment(postRef, e.fragment("PostCardPostFragment", e.Post, ()=>({
            id: true,
            title: true,
            content: true
        })));
}
