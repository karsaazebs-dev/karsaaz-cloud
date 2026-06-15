/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { useRouter } from "expo-router";
import { OnboardingCarousel } from "@/src/components/onboarding/OnboardingCarousel";
import { useOnboardingStore } from "@/src/stores/onboardingStore";

export default function OnboardingScreen() {
  const router = useRouter();
  const complete = useOnboardingStore((s) => s.complete);

  const handleComplete = async () => {
    await complete();
    router.replace("/(auth)/login");
  };

  return <OnboardingCarousel onComplete={handleComplete} />;
}
