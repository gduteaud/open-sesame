import { redirect } from "next/navigation";

type PageProps = { params: Promise<{ eventId: string }> };

/** Legacy `/claim/:id` URLs; canonical claim links are `/:slug`. */
export default async function ClaimEventRedirectPage({ params }: PageProps) {
  const { eventId } = await params;
  redirect(`/${eventId}`);
}
