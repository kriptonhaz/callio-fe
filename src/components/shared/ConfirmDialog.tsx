import {
  DialogActionTrigger,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from "@chakra-ui/react"
import { Button } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

interface ConfirmDialogProps {
  trigger: React.ReactNode
  title: string
  message: string
  onConfirm: () => void
  isLoading?: boolean
  confirmText?: string
  cancelText?: string
}

export function ConfirmDialog({
  trigger,
  title,
  message,
  onConfirm,
  isLoading,
  confirmText,
  cancelText,
}: ConfirmDialogProps) {
  const { t } = useTranslation()

  return (
    <DialogRoot>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <DialogCloseTrigger />
        <DialogBody>
          {message}
        </DialogBody>
        <DialogFooter>
          <DialogActionTrigger asChild>
            <Button variant="outline">
              {cancelText || t("common.cancel")}
            </Button>
          </DialogActionTrigger>
          <Button
            colorScheme="red"
            onClick={onConfirm}
            loading={isLoading}
          >
            {confirmText || t("common.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  )
}
