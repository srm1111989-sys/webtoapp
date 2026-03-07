import { useEffect } from 'react'

interface SEOProps {
  title: string
  description?: string
  canonical?: string
  ogType?: string
  noindex?: boolean
}

export function useSEO({ title, description, canonical, ogType, noindex }: SEOProps) {
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

    // Handle noindex for admin/private pages
    if (noindex) {
      setMeta('name', 'robots', 'noindex, nofollow')
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
      // Remove noindex when leaving the page
      if (noindex) {
        const robotsMeta = document.querySelector<HTMLMetaElement>('meta[name="robots"]')
        if (robotsMeta) {
          robotsMeta.remove()
        }
      }
    }
  }, [title, description, canonical, ogType, noindex])
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
