import { Box, Flex, Heading, Text } from "@chakra-ui/react"
import { motion } from "framer-motion"

const MotionBox = motion.create(Box)

interface PageHeaderProps {
  title: string
  description?: string
  action?: React.ReactNode
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <MotionBox
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      mb={6}
    >
      <Flex justify="space-between" align="start">
        <Box>
          <Heading size="lg" mb={1}>
            {title}
          </Heading>
          {description && (
            <Text color="gray.600" fontSize="sm">
              {description}
            </Text>
          )}
        </Box>
        {action && <Box>{action}</Box>}
      </Flex>
    </MotionBox>
  )
}
