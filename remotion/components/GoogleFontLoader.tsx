// remotion/components/GoogleFontLoader.tsx
import { useEffect } from 'react';
import { delayRender, continueRender } from 'remotion';

// Import only the most reliably available Google Fonts
import { loadFont } from '@remotion/google-fonts/Inter';
import { loadFont as loadRoboto } from '@remotion/google-fonts/Roboto';
import { loadFont as loadOpenSans } from '@remotion/google-fonts/OpenSans';
import { loadFont as loadMontserrat } from '@remotion/google-fonts/Montserrat';
import { loadFont as loadLato } from '@remotion/google-fonts/Lato';
import { loadFont as loadPoppins } from '@remotion/google-fonts/Poppins';
import { loadFont as loadOswald } from '@remotion/google-fonts/Oswald';
import { loadFont as loadPlayfairDisplay } from '@remotion/google-fonts/PlayfairDisplay';

// Load core Google Fonts used in the app
export const loadAllGoogleFonts = () => {
  const waitForFonts = delayRender('Loading Google Fonts');

  // Load fonts and get their waitUntilDone promises
  const inter = loadFont();
  const roboto = loadRoboto();
  const openSans = loadOpenSans();
  const montserrat = loadMontserrat();
  const lato = loadLato();
  const poppins = loadPoppins();
  const oswald = loadOswald();
  const playfairDisplay = loadPlayfairDisplay();

  Promise.all([
    inter.waitUntilDone(),
    roboto.waitUntilDone(),
    openSans.waitUntilDone(),
    montserrat.waitUntilDone(),
    lato.waitUntilDone(),
    poppins.waitUntilDone(),
    oswald.waitUntilDone(),
    playfairDisplay.waitUntilDone(),
  ])
    .then(() => {
      console.log('All Google Fonts loaded successfully!');
      continueRender(waitForFonts);
    })
    .catch((err) => {
      console.error('Error loading Google Fonts:', err);
      continueRender(waitForFonts);
    });
};

// Component to trigger font loading
export const GoogleFontLoader: React.FC = () => {
  useEffect(() => {
    loadAllGoogleFonts();
  }, []);

  return null;
};