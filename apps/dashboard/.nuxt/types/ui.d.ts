import * as ui from '#build/ui'
import type { TVConfig } from '@nuxt/ui'
import type { defaultConfig } from 'tailwind-variants'
import colors from 'tailwindcss/colors'

type IconsConfig = Record<"arrowLeft" | "arrowRight" | "check" | "chevronDoubleLeft" | "chevronDoubleRight" | "chevronDown" | "chevronLeft" | "chevronRight" | "chevronUp" | "close" | "ellipsis" | "external" | "file" | "folder" | "folderOpen" | "loading" | "minus" | "plus" | "search" | "upload" | (string & {}), string>

type NeutralColor = 'slate' | 'gray' | 'zinc' | 'neutral' | 'stone'
type Color = Exclude<keyof typeof colors, 'inherit' | 'current' | 'transparent' | 'black' | 'white' | NeutralColor> | (string & {})

type AppConfigUI = {
  colors?: {
    'primary'?: Color
		'secondary'?: Color
		'success'?: Color
		'info'?: Color
		'warning'?: Color
		'error'?: Color
    neutral?: NeutralColor | (string & {})
  }
  icons?: Partial<IconsConfig>
  tv?: typeof defaultConfig
} & TVConfig<typeof ui>

declare module '@nuxt/schema' {
  interface AppConfigInput {
    /**
     * Nuxt UI theme configuration
     * @see https://ui3.nuxt.com/getting-started/theme#customize-theme
     */
    ui?: AppConfigUI
  }
}

export {}
