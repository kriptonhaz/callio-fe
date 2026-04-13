export type LayoutScope = 'global' | 'campaign'
export type LayoutSource = 'factory' | 'global' | 'campaign'

export interface LayoutFieldConfig {
  key: string
  label: string
  editable: boolean
  order: number
}

export interface LayoutSectionConfig {
  id: string
  title: string
  order: number
  fields: LayoutFieldConfig[]
}

export interface LayoutSectionsJson {
  schemaVersion: number
  sections: LayoutSectionConfig[]
}

export interface ResolvedLayoutResponse {
  inherited: boolean
  source: LayoutSource
  layout: LayoutSectionsJson
}

export interface CustomFieldKeysResponse {
  keys: string[]
}

export type UpsertLayoutRequest = LayoutSectionsJson
