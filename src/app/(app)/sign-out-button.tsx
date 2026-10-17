import { signOut } from "@/modules/auth/actions";

export function SignOutButton() {
  return (
    <form action={signOut}>
      <button type="submit" className="text-sm text-muted underline">
        Log out
      </button>
    </form>
  );
}
