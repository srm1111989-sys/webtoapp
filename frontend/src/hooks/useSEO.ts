import { useEffect } from 'react'

interface SEOProps {
  title: string
  description?: string
}

export function useSEO({ title, description }: SEOProps) {
  useEffect(() => {
    document.title = `${title} | WebToApp`

    if (description) {
      const meta = document.querySelector('meta[name="description"]')
      if (meta) {
        meta.setAttribute('content', description)
      }
    }

    return () => {
      document.title = 'WebToApp - Convert Any Website Into Android & Windows Apps'
    }
  }, [title, description])
}
