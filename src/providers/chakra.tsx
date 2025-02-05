'use client'

import { ChakraProvider, extendTheme } from '@chakra-ui/react'

const theme = extendTheme({
  // Your custom theme config
})

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ChakraProvider theme={theme}>
      {children}
    </ChakraProvider>
  )
}