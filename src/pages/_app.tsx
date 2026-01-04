import Head from 'next/head'
import type { AppProps } from 'next/app'
import { Manrope } from 'next/font/google'
import '@/styles/globals.css'

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
})

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div className={`${manrope.variable} font-sans`}>
      <Head>
        <title>React2Shell Scanner</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/shield.svg" type="image/svg+xml" />
      </Head>
      <Component {...pageProps} />
    </div>
  )
}
