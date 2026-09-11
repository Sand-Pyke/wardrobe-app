import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { LegalCenterModal } from "./src/components/LegalCenterModal";
import { PrivacyConsentModal } from "./src/components/PrivacyConsentModal";
import { LegalDocumentType } from "./src/legal/content";
import { WardrobeNavigator } from "./src/navigation/WardrobeNavigator";
import { styles } from "./src/styles";

const PRIVACY_CONSENT_KEY = "@x2-wardrobe/privacy-consent:v1";

export default function App() {
  const [consentReady, setConsentReady] = useState(false);
  const [hasConsent, setHasConsent] = useState(false);
  const [legalView, setLegalView] = useState<
    "center" | LegalDocumentType | null
  >(null);

  useEffect(() => {
    AsyncStorage.getItem(PRIVACY_CONSENT_KEY)
      .then((value) => {
        if (!value) return;
        try {
          const consent = JSON.parse(value) as { version?: number };
          setHasConsent(consent.version === 1);
        } catch {
          setHasConsent(false);
        }
      })
      .finally(() => setConsentReady(true));
  }, []);

  async function acceptPrivacy() {
    await AsyncStorage.setItem(
      PRIVACY_CONSENT_KEY,
      JSON.stringify({ acceptedAt: new Date().toISOString(), version: 1 }),
    );
    setHasConsent(true);
  }

  async function withdrawPrivacyConsent() {
    await AsyncStorage.removeItem(PRIVACY_CONSENT_KEY);
    setLegalView(null);
    setHasConsent(false);
  }

  return (
    <GestureHandlerRootView style={styles.gestureRoot}>
      <SafeAreaProvider>
        {consentReady && hasConsent ? (
          <WardrobeNavigator onOpenLegal={() => setLegalView("center")} />
        ) : (
          <View style={styles.safe} />
        )}
        <PrivacyConsentModal
          visible={consentReady && !hasConsent && legalView === null}
          onAccept={acceptPrivacy}
          onOpenDocument={setLegalView}
        />
        <LegalCenterModal
          visible={legalView !== null}
          initialView={legalView ?? "center"}
          onClose={() => setLegalView(null)}
          onWithdrawConsent={withdrawPrivacyConsent}
        />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
