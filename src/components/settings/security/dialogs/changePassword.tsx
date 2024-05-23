import { memo, useState, useEffect, useCallback } from "react"
import { Dialog, DialogContent, DialogFooter, DialogHeader } from "@/components/ui/dialog"
import eventEmitter from "@/lib/eventEmitter"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Eye, EyeOff } from "lucide-react"
import worker from "@/lib/worker"
import useLoadingToast from "@/hooks/useLoadingToast"
import useErrorToast from "@/hooks/useErrorToast"
import useSuccessToast from "@/hooks/useSuccessToast"
import { cn } from "@/lib/utils"

export const ChangePasswordDialog = memo(() => {
	const [open, setOpen] = useState<boolean>(false)
	const { t } = useTranslation()
	const [inputs, setInputs] = useState<{
		new: string
		confirm: string
		password: string
		notIdentical: boolean
	}>({
		new: "",
		confirm: "",
		password: "",
		notIdentical: false
	})
	const [showPassword, setShowPassword] = useState<boolean>(false)
	const loadingToast = useLoadingToast()
	const errorToast = useErrorToast()
	const successToast = useSuccessToast()

	const close = useCallback(() => {
		setOpen(false)
	}, [])

	const onNewChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		setInputs(prev => ({
			...prev,
			new: e.target.value
		}))
	}, [])

	const onConfirmChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		setInputs(prev => ({
			...prev,
			confirm: e.target.value
		}))
	}, [])

	const onPasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		setInputs(prev => ({
			...prev,
			password: e.target.value
		}))
	}, [])

	const toggleShowPassword = useCallback(() => {
		setShowPassword(prev => !prev)
	}, [])

	const save = useCallback(async () => {
		if (inputs.new.trim() !== inputs.confirm.trim() || inputs.new.length === 0 || inputs.new.length === 0) {
			setInputs(prev => ({
				...prev,
				notIdentical: true
			}))

			return
		}

		const toast = loadingToast()

		try {
			await worker.changePassword({
				newPassword: inputs.new,
				currentPassword: inputs.password
			})

			setTimeout(() => setOpen(false), 100)

			successToast(t("dialogs.changePassword.successToast"))
		} catch (e) {
			console.error(e)

			errorToast((e as unknown as Error).message ?? (e as unknown as Error).toString())
		} finally {
			toast.dismiss()
		}
	}, [loadingToast, errorToast, inputs, successToast, t])

	useEffect(() => {
		const listener = eventEmitter.on("openChangePasswordDialog", () => {
			setInputs({
				new: "",
				confirm: "",
				password: "",
				notIdentical: false
			})
			setOpen(true)
		})

		return () => {
			listener.remove()
		}
	}, [])

	return (
		<Dialog
			open={open}
			onOpenChange={setOpen}
		>
			<DialogContent className="outline-none focus:outline-none active:outline-none hover:outline-none">
				<DialogHeader>{t("dialogs.changePassword.title")}</DialogHeader>
				<div className="flex flex-col gap-3 mb-3">
					<div className="flex flex-col gap-1">
						<p className="text-sm text-muted-foreground">{t("dialogs.changePassword.newPassword")}</p>
						<div className="absolute right-0 mr-[36px] mt-[35px]">
							{showPassword ? (
								<EyeOff
									size={18}
									onClick={toggleShowPassword}
									className="cursor-pointer"
								/>
							) : (
								<Eye
									size={18}
									onClick={toggleShowPassword}
									className="cursor-pointer"
								/>
							)}
						</div>
						<Input
							type={showPassword ? "text" : "password"}
							value={inputs.new}
							onChange={onNewChange}
							placeholder={t("dialogs.changePassword.newPasswordPlaceholder")}
							className={cn("pr-12", inputs.notIdentical ? "border-red-500" : undefined)}
						/>
					</div>
					<div className="flex flex-col gap-1">
						<p className="text-sm text-muted-foreground">{t("dialogs.changePassword.confirmNewPassword")}</p>
						<div className="absolute right-0 mr-[36px] mt-[35px]">
							{showPassword ? (
								<EyeOff
									size={18}
									onClick={toggleShowPassword}
									className="cursor-pointer"
								/>
							) : (
								<Eye
									size={18}
									onClick={toggleShowPassword}
									className="cursor-pointer"
								/>
							)}
						</div>
						<Input
							type={showPassword ? "text" : "password"}
							value={inputs.confirm}
							onChange={onConfirmChange}
							placeholder={t("dialogs.changePassword.confirmNewPasswordPlaceholder")}
							className={cn("pr-12", inputs.notIdentical ? "border-red-500" : undefined)}
						/>
					</div>
					<div className="flex flex-col gap-1">
						<p className="text-sm text-muted-foreground">{t("dialogs.changePassword.currentPassword")}</p>
						<div className="absolute right-0 mr-[36px] mt-[35px]">
							{showPassword ? (
								<EyeOff
									size={18}
									onClick={toggleShowPassword}
									className="cursor-pointer"
								/>
							) : (
								<Eye
									size={18}
									onClick={toggleShowPassword}
									className="cursor-pointer"
								/>
							)}
						</div>
						<Input
							type={showPassword ? "text" : "password"}
							value={inputs.password}
							onChange={onPasswordChange}
							placeholder={t("dialogs.changePassword.currentPasswordPlaceholder")}
							className="pr-12"
						/>
					</div>
				</div>
				<DialogFooter>
					<Button
						onClick={close}
						variant="outline"
					>
						{t("dialogs.changePassword.close")}
					</Button>
					<Button
						onClick={save}
						variant="default"
					>
						{t("dialogs.changePassword.save")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
})

export default ChangePasswordDialog
