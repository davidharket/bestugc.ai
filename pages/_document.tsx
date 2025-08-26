import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.svg" sizes="any" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
        
        {/* Global Meta Tags */}
        <meta name="keywords" content="AI video ads, UGC creator, social media marketing, TikTok ads, Instagram ads, video marketing, AI avatars" />
        <meta name="author" content="Best UGC" />
        <meta name="theme-color" content="#000000" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        
        {/* Default Open Graph Meta Tags */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Best UGC" />
        <meta property="og:title" content="Best UGC - The #1 AI UGC Tool" />
        <meta property="og:description" content="Create high-converting AI video ads in minutes. Transform your product links into professional UGC content that drives real results. Never overpay for UGC again." />
        <meta property="og:image" content="https://bestugc.ai/uploads/twitter-image.png?v=2" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="675" />
        <meta property="og:image:alt" content="The Best UGC AI Tool - Create professional video ads with AI avatars" />
        <meta property="og:url" content="https://bestugc.ai/" />
        
        {/* Default Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:creator" content="@davidharket" />
        <meta name="twitter:title" content="Best UGC - The #1 AI UGC Tool" />
        <meta name="twitter:description" content="Create high-converting AI video ads in minutes. Transform your product links into professional UGC content that drives real results. Never overpay for UGC again." />
        <meta name="twitter:image" content="https://bestugc.ai/uploads/twitter-image.png?v=2" />
        <meta name="twitter:image:width" content="1200" />
        <meta name="twitter:image:height" content="675" />
        <meta name="twitter:image:alt" content="The Best UGC AI Tool - Create professional video ads with AI avatars" />
        
        {/* Google Fonts for subtitles */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=Roboto:wght@400;500;600;700&family=Open+Sans:wght@400;500;600;700&family=Lato:wght@400;500;600;700&display=swap" 
          rel="stylesheet" 
        />
        
        {/* Preload custom font */}
        <link rel="preload" href="/fonts/THEBOLDFONT-FREEVERSION.woff" as="font" type="font/woff" crossOrigin="anonymous" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
