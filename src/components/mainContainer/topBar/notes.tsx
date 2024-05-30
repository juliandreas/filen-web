import { memo, useCallback } from "react"
import { useNotesStore } from "@/stores/notes.store"
import { CheckCircle2, Loader, MoreVertical } from "lucide-react"
import { showInputDialog } from "@/components/dialogs/input"
import worker from "@/lib/worker"
import ContextMenu from "../innerSideBar/notes/note/contextMenu"
import useLoadingToast from "@/hooks/useLoadingToast"
import useErrorToast from "@/hooks/useErrorToast"
import { cn } from "@/lib/utils"
import { useTheme } from "@/providers/themeProvider"
import { useTranslation } from "react-i18next"

export const Notes = memo(() => {
	const { selectedNote, setSelectedNote, setNotes, synced } = useNotesStore()
	const loadingToast = useLoadingToast()
	const errorToast = useErrorToast()
	const { dark } = useTheme()
	const { t } = useTranslation()

	const triggerMoreIconContextMenu = useCallback(
		(e: React.MouseEvent<SVGSVGElement, MouseEvent> | React.MouseEvent<HTMLDivElement, MouseEvent>) => {
			e.preventDefault()

			const contextMenuEvent = new MouseEvent("contextmenu", {
				bubbles: true,
				cancelable: true,
				view: window,
				clientX: e.clientX,
				clientY: e.clientY
			})

			e.currentTarget.dispatchEvent(contextMenuEvent)
		},
		[]
	)

	const rename = useCallback(async () => {
		if (!selectedNote) {
			return
		}

		const inputResponse = await showInputDialog({
			title: t("notes.dialogs.renameNote.title"),
			continueButtonText: t("notes.dialogs.renameNote.continue"),
			value: selectedNote.title,
			autoFocusInput: true,
			placeholder: t("notes.dialogs.renameNote.placeholder"),
			continueButtonVariant: "default"
		})

		if (inputResponse.cancelled) {
			return
		}

		const toast = loadingToast()

		try {
			await worker.editNoteTitle({ uuid: selectedNote.uuid, title: inputResponse.value })

			setSelectedNote(prev => (prev ? { ...prev, title: inputResponse.value } : prev))
			setNotes(prev =>
				prev.map(prevNote => (prevNote.uuid === selectedNote.uuid ? { ...prevNote, title: inputResponse.value } : prevNote))
			)
		} catch (e) {
			console.error(e)

			errorToast((e as unknown as Error).message ?? (e as unknown as Error).toString())
		} finally {
			toast.dismiss()
		}
	}, [selectedNote, setSelectedNote, setNotes, loadingToast, errorToast, t])

	if (!selectedNote) {
		return null
	}

	return (
		<div className={cn("flex flex-row px-4 items-center gap-3 w-full h-12 z-50", dark ? "bg-[#151518]" : "bg-[#FBFBFB]")}>
			<div className="flex flex-row">
				{synced ? <CheckCircle2 className="text-green-500" /> : <Loader className="animate-spin-medium" />}
			</div>
			<div className="flex flex-row grow">
				<p
					className="line-clamp-1 text-ellipsis break-all cursor-text"
					onClick={rename}
				>
					{selectedNote.title}
				</p>
			</div>
			<div className="flex flex-row">
				<ContextMenu
					note={selectedNote}
					setHovering={() => {}}
				>
					<div
						className="flex flex-row p-1 rounded-md hover:bg-secondary cursor-pointer"
						onClick={triggerMoreIconContextMenu}
					>
						<MoreVertical
							onClick={triggerMoreIconContextMenu}
							className="cursor-pointer"
						/>
					</div>
				</ContextMenu>
			</div>
		</div>
	)
})

export default Notes
