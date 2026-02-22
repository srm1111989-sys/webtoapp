import { useEffect } from 'react'

interface SEOProps {
  title: string
  description?: string
  canonical?: string
  ogType?: string
}

export function useSEO({ title, description, canonical, ogType }: SEOProps) {
  useEffect(() => {
    document.title = `${title} | WebToApp`

    if (description) {
      setMeta('name', 'description', description)
      setMeta('property', 'og:description', description)
      setMeta('property', 'twitter:description', description)
    }

    setMeta('property', 'og:title', `${title} | WebToApp`)
    setMeta('property', 'twitter:title', `${title} | WebToApp`)

    if (ogType) {
      setMeta('property', 'og:type', ogType)
    }

    if (canonical) {
      let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
      if (link) {
        link.href = canonical
      } else {
        link = document.createElement('link')
        link.rel = 'canonical'
        link.href = canonical
        document.head.appendChild(link)
      }
    }

    return () => {
      document.title = 'WebToApp - Convert Any Website Into Android & Windows Apps'
    }
  }, [title, description, canonical, ogType])
}

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let meta = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (meta) {
    meta.setAttribute('content', content)
  } else {
    meta = document.createElement('meta')
    meta.setAttribute(attr, key)
    meta.setAttribute('content', content)
    document.head.appendChild(meta)
  }
}
