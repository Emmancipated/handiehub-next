import MessagesView from "@/components/messages/MessagesView";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ chatId: string }>;
}) {
  const { chatId } = await params;
  return <MessagesView initialChatId={chatId} />;
}
