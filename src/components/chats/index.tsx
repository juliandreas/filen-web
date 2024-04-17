import { memo } from "react"
import { ResizablePanelGroup, ResizableHandle, ResizablePanel } from "../ui/resizable"
import useIsMobile from "@/hooks/useIsMobile"
import Conversation from "./conversation"
import Participants from "./participants"
import { useChatsStore } from "@/stores/chats.store"
import { useLocalStorage } from "@uidotdev/usehooks"

export const Chats = memo(() => {
	const isMobile = useIsMobile()
	const { selectedConversation } = useChatsStore()
	const [conversationParticipantsContainerOpen] = useLocalStorage<boolean>(
		`conversationParticipantsContainerOpen:${selectedConversation?.uuid}`,
		true
	)

	return (
		<div className="w-full h-screen flex flex-row">
			<ResizablePanelGroup direction="horizontal">
				<ResizablePanel
					defaultSize={85}
					minSize={20}
					maxSize={85}
					order={1}
				>
					{selectedConversation && <Conversation conversation={selectedConversation} />}
				</ResizablePanel>
				<ResizableHandle className="bg-transparent w-0" />
				{conversationParticipantsContainerOpen && !isMobile && (
					<ResizablePanel
						defaultSize={15}
						minSize={10}
						maxSize={20}
						order={2}
						className="border-l"
					>
						{selectedConversation && <Participants conversation={selectedConversation} />}
					</ResizablePanel>
				)}
			</ResizablePanelGroup>
		</div>
	)
})

export default Chats