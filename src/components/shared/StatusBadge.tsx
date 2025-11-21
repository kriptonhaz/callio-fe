import { Badge } from "@chakra-ui/react"
import type { Status, LeadStatus } from "../../lib/mockDb"

interface StatusBadgeProps {
  status: Status | LeadStatus | "paid" | "pending" | "failed" | "paused" | "completed"
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const getColorScheme = () => {
    switch (status) {
      case "active":
      case "hot":
      case "paid":
        return "green"
      case "warm":
      case "pending":
      case "paused":
        return "yellow"
      case "cold":
      case "inactive":
      case "failed":
        return "gray"
      case "completed":
        return "blue"
      default:
        return "gray"
    }
  }

  return (
    <Badge colorScheme={getColorScheme()} textTransform="capitalize">
      {status}
    </Badge>
  )
}
