'use client'

import { useEffect, useRef } from 'react'
import {
  GalleryThumbnailsIcon,
  type GalleryThumbnailsIconHandle,
} from '@/components/ui/gallery-thumbnails'
import {
  IconWrapper,
  useAnimateIconContext,
  type IconProps,
} from '@/components/animate-ui/icons/icon'

type GalleryThumbnailsProps = IconProps<string>

function IconComponent({ size, className }: GalleryThumbnailsProps) {
  const { active } = useAnimateIconContext()
  const iconRef = useRef<GalleryThumbnailsIconHandle>(null)

  useEffect(() => {
    if (active) {
      iconRef.current?.startAnimation()
    } else {
      iconRef.current?.stopAnimation()
    }
  }, [active])

  return (
    <GalleryThumbnailsIcon
      ref={iconRef}
      size={size}
      className={className as string}
    />
  )
}

function GalleryThumbnails(props: GalleryThumbnailsProps) {
  return <IconWrapper icon={IconComponent} {...props} />
}

export { GalleryThumbnails, type GalleryThumbnailsProps }
