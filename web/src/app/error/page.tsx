import { redirect } from "next/navigation";

export default function ErrorIndexPage() {
  redirect("/error/404");
}
