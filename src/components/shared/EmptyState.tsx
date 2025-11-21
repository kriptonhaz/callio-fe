import { Box, Center, Text, VStack } from "@chakra-ui/react"
import { FileQuestion } from "lucide-react"

interface EmptyStateProps {
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <Center py={12}>
      <VStack gap={4}>
        <Box color="gray.400">
          <FileQuestion size={48} />
        </Box>
        <VStack gap={1}>
          <Text fontSize="lg" fontWeight="medium" color="gray.700">
            {title}
          </Text>
          {description && (
            <Text fontSize="sm" color="gray.500">
              {description}
            </Text>
          )}
        </VStack>
        {action && <Box mt={2}>{action}</Box>}
      </VStack>
    </Center>
  )
}
