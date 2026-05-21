import { PublicShareView } from "./PublicShareView";

export const metadata = {
  title: "Shared file",
};

export default async function PublicSharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <PublicShareView token={token} />;
}
