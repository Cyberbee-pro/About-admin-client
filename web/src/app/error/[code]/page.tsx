import type { Metadata } from "next";
import ErrorScreen from "@/components/ErrorScreen";
import {
  ERROR_DEFINITIONS,
  getErrorDetails,
} from "@/lib/errors";

export interface ErrorPageProps {
  params: Promise<{ code: string }>;
  searchParams?: Promise<{ title?: string; description?: string }>;
}

/**
 * Pre-generate static routes for all standard Evangelion error codes.
 */
export function generateStaticParams() {
  return Object.keys(ERROR_DEFINITIONS).map((code) => ({
    code,
  }));
}

/**
 * Generate metadata matching error title and description.
 */
export async function generateMetadata({
  params,
  searchParams,
}: ErrorPageProps): Promise<Metadata> {
  const { code } = await params;
  const search = searchParams ? await searchParams : undefined;
  const details = getErrorDetails(code, search?.title, search?.description);

  return {
    title: `Err ${details.code} : ${details.title}`,
    description: details.description,
  };
}

export default async function ErrorCodePage({
  params,
  searchParams,
}: ErrorPageProps) {
  const { code } = await params;
  const search = searchParams ? await searchParams : undefined;

  return (
    <ErrorScreen
      code={code}
      title={search?.title}
      description={search?.description}
    />
  );
}
