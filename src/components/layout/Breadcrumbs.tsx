import { Flex, Text } from "@chakra-ui/react"
import { Link, useRouterState } from "@tanstack/react-router"
import { ChevronRight } from "lucide-react"
import { useTranslation } from "react-i18next"

export function Breadcrumbs() {
  const { t } = useTranslation()
  const router = useRouterState()
  const pathname = router.location.pathname

  // Generate breadcrumbs from pathname
  const segments = pathname.split("/").filter(Boolean)
  
  const breadcrumbs = segments.map((segment, index) => {
    const path = "/" + segments.slice(0, index + 1).join("/")
    
    // Try to translate the segment
    let label = segment
    if (segment === "super-admin" || segment === "admin" || segment === "agent") {
      label = segment.charAt(0).toUpperCase() + segment.slice(1)
    } else if (t(`nav.${segment}`) !== `nav.${segment}`) {
      label = t(`nav.${segment}`)
    } else {
      label = segment.charAt(0).toUpperCase() + segment.slice(1)
    }

    return { label, path }
  })

  // Add home breadcrumb
  const allBreadcrumbs = [
    { label: t("nav.dashboard"), path: "/" },
    ...breadcrumbs,
  ]

  // Don't show breadcrumbs on home page
  if (pathname === "/") {
    return null
  }

  return (
    <Flex align="center" gap={2}>
      {allBreadcrumbs.map((crumb, index) => {
        const isLast = index === allBreadcrumbs.length - 1

        return (
          <Flex key={crumb.path} align="center" gap={2}>
            {index > 0 && <ChevronRight size={14} color="gray" />}
            {isLast ? (
              <Text fontSize="sm" fontWeight="medium">
                {crumb.label}
              </Text>
            ) : (
              <Link to={crumb.path}>
                <Text
                  fontSize="sm"
                  color="gray.600"
                  _hover={{ color: "primary.500", textDecoration: "underline" }}
                >
                  {crumb.label}
                </Text>
              </Link>
            )}
          </Flex>
        )
      })}
    </Flex>
  )
}
