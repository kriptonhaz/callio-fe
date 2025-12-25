import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { useGsmDevices } from './useGsmDevices'

export interface GoipLineConfig {
  lineNumber: number
  authId: string
  authPassword: string
  gwPrefix: string
  proxy: string
  registrar: string
  registerExpired: number
  phoneNumber: string
  displayName: string
  outboundProxy: string
  homeDomain: string
}

export interface GoipDeviceSipConfigResponse {
  deviceId: string
  deviceName: string
  totalPorts: number
  lines: GoipLineConfig[]
}

export interface GoipSipConfig {
  deviceId: string
  deviceName: string
  lines: GoipLineConfig[]
}

/**
 * Fetches SIP configurations for a specific GSM device
 */
const fetchDeviceSipConfig = async (
  deviceId: string,
): Promise<GoipDeviceSipConfigResponse | null> => {
  try {
    const response = await apiClient
      .get(`goip/${deviceId}/sip/config`)
      .json<GoipDeviceSipConfigResponse>()

    // Ensure response has the expected structure
    if (!response || !Array.isArray(response.lines)) {
      console.warn(
        `SIP config for device ${deviceId} has invalid structure:`,
        response,
      )
      return null
    }

    return response
  } catch (error) {
    console.error(`Failed to fetch SIP config for device ${deviceId}:`, error)
    return null
  }
}

/**
 * Hook to fetch all SIP configurations from all GSM devices
 * This is used to determine which SIP extensions are assigned to GoIP devices
 */
export const useAllGoipSipConfigs = () => {
  // First, get all GSM devices
  const { data: devicesData } = useGsmDevices({
    page: 1,
    limit: 100, // Get all devices
  })

  // Then fetch SIP configs for all devices
  return useQuery({
    queryKey: ['all-goip-sip-configs', devicesData?.data?.map((d) => d.id)],
    queryFn: async (): Promise<GoipSipConfig[]> => {
      if (!devicesData?.data || devicesData.data.length === 0) {
        return []
      }

      // Fetch SIP configs for all devices in parallel
      const configPromises = devicesData.data.map(async (device) => {
        const config = await fetchDeviceSipConfig(device.id)

        // Return valid config or null
        if (config && config.lines) {
          return {
            deviceId: config.deviceId,
            deviceName: config.deviceName,
            lines: config.lines,
          }
        }

        return null
      })

      const results = await Promise.all(configPromises)

      // Filter out null values
      return results.filter(
        (config): config is GoipSipConfig => config !== null,
      )
    },
    enabled: !!devicesData?.data && devicesData.data.length > 0,
    staleTime: 30 * 1000, // 30 seconds
  })
}

/**
 * Helper function to check if a SIP extension is assigned to any GoIP device
 */
export const isExtensionAssignedToGoip = (
  extensionId: string,
  goipConfigs: GoipSipConfig[],
): { isAssigned: boolean; deviceName?: string; lineNumber?: number } => {
  // Safety check: ensure goipConfigs is an array
  if (!Array.isArray(goipConfigs)) {
    return { isAssigned: false }
  }

  for (const device of goipConfigs) {
    // Safety check: ensure device exists and lines is an array
    if (!device || !Array.isArray(device.lines)) {
      continue
    }

    for (const line of device.lines) {
      // Safety check: ensure line exists and authId matches
      // Also check that authId is not empty
      if (line && line.authId && line.authId === extensionId) {
        return {
          isAssigned: true,
          deviceName: device.deviceName,
          lineNumber: line.lineNumber,
        }
      }
    }
  }
  return { isAssigned: false }
}
