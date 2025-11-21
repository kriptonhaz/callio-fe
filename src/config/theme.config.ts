import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react"

const customConfig = defineConfig({
  theme: {
    tokens: {
      colors: {
        // Primary - Orange
        primary: {
          50: { value: "#FFF5EB" },
          100: { value: "#FFE6CC" },
          200: { value: "#FFCC99" },
          300: { value: "#FFB366" },
          400: { value: "#FF9933" },
          500: { value: "#FF6A00" }, // Main primary
          600: { value: "#CC5500" },
          700: { value: "#994000" },
          800: { value: "#662B00" },
          900: { value: "#331500" },
        },
        // Secondary - Navy Blue
        secondary: {
          50: { value: "#E6EBF2" },
          100: { value: "#CCDAE5" },
          200: { value: "#99B5CB" },
          300: { value: "#6690B1" },
          400: { value: "#336B97" },
          500: { value: "#0B1F3B" }, // Main secondary
          600: { value: "#091930" },
          700: { value: "#071324" },
          800: { value: "#050D18" },
          900: { value: "#02060C" },
        },
      },
    },
    semanticTokens: {
      colors: {
        // Semantic color mappings
        "primary.solid": {
          value: { base: "{colors.primary.500}", _dark: "{colors.primary.400}" },
        },
        "primary.contrast": {
          value: { base: "white", _dark: "{colors.secondary.900}" },
        },
        "secondary.solid": {
          value: { base: "{colors.secondary.500}", _dark: "{colors.secondary.300}" },
        },
        "secondary.contrast": {
          value: { base: "white", _dark: "{colors.secondary.900}" },
        },
        // Background colors
        "bg.canvas": {
          value: { base: "white", _dark: "{colors.secondary.900}" },
        },
        "bg.surface": {
          value: { base: "{colors.gray.50}", _dark: "{colors.secondary.800}" },
        },
        "bg.subtle": {
          value: { base: "{colors.gray.100}", _dark: "{colors.secondary.700}" },
        },
        // Border colors
        "border.default": {
          value: { base: "{colors.gray.200}", _dark: "{colors.secondary.600}" },
        },
        "border.emphasized": {
          value: { base: "{colors.gray.300}", _dark: "{colors.secondary.500}" },
        },
      },
    },
  },
})

export const system = createSystem(defaultConfig, customConfig)
