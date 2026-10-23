import { ComingNext } from "@/components/layout/coming-next";

export default function AdminUsersPage() {
  return (
    <ComingNext
      title="Admin users"
      note="There is no admin-users endpoint on the backend yet — admin access is currently granted by email domain in the auth middleware, not by a managed list. This page needs that backend before it can show anything real."
    />
  );
}
