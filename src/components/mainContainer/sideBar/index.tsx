import { memo, useEffect, useRef, useCallback } from "react"
import Button from "./button"
import useSDKConfig from "@/hooks/useSDKConfig"
import { IS_DESKTOP, SIDEBAR_WIDTH, IS_APPLE_DEVICE } from "@/constants"
import { useQuery } from "@tanstack/react-query"
import worker from "@/lib/worker"
import { useChatsStore } from "@/stores/chats.store"
import { useContactsStore } from "@/stores/contacts.store"
import { type SocketEvent } from "@filen/sdk"
import { getSocket } from "@/lib/socket"
import eventEmitter from "@/lib/eventEmitter"
import { cn } from "@/lib/utils"

export const SideBar = memo(() => {
	const { userId, baseFolderUUID } = useSDKConfig()
	const setUnread = useChatsStore(useCallback(state => state.setUnread, []))
	const unreadQueryLastUpdateRef = useRef<number>(-1)
	const setRequestsInCount = useContactsStore(useCallback(state => state.setRequestsInCount, []))
	const contactsRequestInCountQueryLastUpdateRef = useRef<number>(-1)

	const chatsUnreadCountQuery = useQuery({
		queryKey: ["chatsUnreadCount"],
		queryFn: () => worker.chatsUnreadCount(),
		refetchInterval: 15000,
		refetchIntervalInBackground: true,
		refetchOnReconnect: true
	})

	const contactsRequestInCountQuery = useQuery({
		queryKey: ["contactsRequestInCount"],
		queryFn: () => worker.contactsRequestInCount(),
		refetchInterval: 15000,
		refetchIntervalInBackground: true,
		refetchOnReconnect: true
	})

	const socketEventListener = useCallback(
		async (event: SocketEvent) => {
			try {
				if (event.type === "chatMessageNew") {
					if (userId !== event.data.senderId) {
						setUnread(prev => prev + 1)
					}
				} else if (event.type === "chatConversationDeleted" || event.type === "chatConversationsNew") {
					await chatsUnreadCountQuery.refetch()
				} else if (event.type === "contactRequestReceived") {
					await contactsRequestInCountQuery.refetch()
				}
			} catch (e) {
				console.error(e)
			}
		},
		[setUnread, chatsUnreadCountQuery, userId, contactsRequestInCountQuery]
	)

	useEffect(() => {
		if (chatsUnreadCountQuery.isSuccess && unreadQueryLastUpdateRef.current !== chatsUnreadCountQuery.dataUpdatedAt) {
			unreadQueryLastUpdateRef.current = chatsUnreadCountQuery.dataUpdatedAt

			setUnread(chatsUnreadCountQuery.data)
		}
	}, [chatsUnreadCountQuery.isSuccess, chatsUnreadCountQuery.data, setUnread, chatsUnreadCountQuery.dataUpdatedAt])

	useEffect(() => {
		if (
			contactsRequestInCountQuery.isSuccess &&
			contactsRequestInCountQueryLastUpdateRef.current !== contactsRequestInCountQuery.dataUpdatedAt
		) {
			contactsRequestInCountQueryLastUpdateRef.current = contactsRequestInCountQuery.dataUpdatedAt

			setRequestsInCount(contactsRequestInCountQuery.data)
		}
	}, [
		contactsRequestInCountQuery.isSuccess,
		contactsRequestInCountQuery.data,
		setRequestsInCount,
		contactsRequestInCountQuery.dataUpdatedAt
	])

	useEffect(() => {
		const updateChatsUnreadCountListener = eventEmitter.on("updateChatsUnreadCount", () => {
			chatsUnreadCountQuery.refetch().catch(console.error)
		})

		const updateContactsRequestsInCountListener = eventEmitter.on("updateContactsRequestsInCount", () => {
			contactsRequestInCountQuery.refetch().catch(console.error)
		})

		return () => {
			updateChatsUnreadCountListener.remove()
			updateContactsRequestsInCountListener.remove()
		}
	}, [chatsUnreadCountQuery, contactsRequestInCountQuery])

	useEffect(() => {
		const socket = getSocket()

		socket.addListener("socketEvent", socketEventListener)

		return () => {
			socket.removeListener("socketEvent", socketEventListener)
		}
	}, [socketEventListener])

	return (
		<div
			className={cn(
				"flex flex-col h-full gap-2.5 select-none items-center overflow-hidden dragselect-start-allowed",
				!IS_DESKTOP && "py-3",
				IS_DESKTOP && IS_APPLE_DEVICE && "pt-9",
				IS_DESKTOP && !IS_APPLE_DEVICE && "pt-1"
			)}
			style={{
				width: SIDEBAR_WIDTH
			}}
		>
			<Button id={baseFolderUUID} />
			<Button id="transfers" />
			<Button id="notes" />
			<Button id="chats" />
			<Button id="contacts" />
			{IS_DESKTOP && <Button id="syncs" />}
			{IS_DESKTOP && <Button id="mounts" />}
			{/*{IS_DESKTOP && <Button id="terminal" />}*/}
		</div>
	)
})

export default SideBar
