import type { Metadata } from "next";
import ErrorScreen from "@/components/ErrorScreen";

export const metadata: Metadata = {
  title: "Err 404 : Not Found",
  description: "something broke in the server",
};

export default function NotFound() {
  return <ErrorScreen code={404} />;
}
