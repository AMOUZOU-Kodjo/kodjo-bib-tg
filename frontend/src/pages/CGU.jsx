import { Trans, useTranslation } from "react-i18next";
import LegalPage, { LegalSection } from "../components/layout/LegalPage";
import { useSiteSettings } from "../context/SiteSettingsContext";

export default function CGU() {
  const { t } = useTranslation();
  const { contactEmail, creditsParUpload, siteName } = useSiteSettings();
  return (
    <LegalPage title={t("legal.cguTitle")}>
      <LegalSection title={t("legal.cgu_s1t")}>
        <p>{t("legal.cgu_s1", { siteName })}</p>
      </LegalSection>
      <LegalSection title={t("legal.cgu_s2t")}>
        <p>{t("legal.cgu_s2a")}</p>
        <p>{t("legal.cgu_s2b")}</p>
      </LegalSection>
      <LegalSection title={t("legal.cgu_s3t")}>
        <ul className="list-disc pl-5 space-y-1">
          <li>{t("legal.cgu_s3a")}</li>
          <li>{t("legal.cgu_s3b")}</li>
          <li>{t("legal.cgu_s3c")}</li>
          <li>{t("legal.cgu_s3d")}</li>
        </ul>
      </LegalSection>
      <LegalSection title={t("legal.cgu_s4t")}>
        <p>{t("legal.cgu_s4a")}</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>{t("legal.cgu_s4b")}</li>
          <li>{t("legal.cgu_s4c")}</li>
          <li>{t("legal.cgu_s4d")}</li>
          <li>{t("legal.cgu_s4e")}</li>
        </ul>
        <p>{t("legal.cgu_s4f")}</p>
      </LegalSection>
      <LegalSection title={t("legal.cgu_s5t")}>
        <p>
          {t("legal.cgu_s5a")}{" "}
          <strong>{creditsParUpload} {creditsParUpload > 1 ? t("legal.cgu_s5credits") : t("legal.cgu_s5credit")}</strong>.{" "}
          {t("legal.cgu_s5b")} <strong>1 {t("legal.cgu_s5credit")}</strong>, {t("legal.cgu_s5c")}
        </p>
        <p>{t("legal.cgu_s5d")}</p>
      </LegalSection>
      <LegalSection title={t("legal.cgu_s6t")}>
        <p>{t("legal.cgu_s6a", { siteName })}</p>
        <p>{t("legal.cgu_s6b")}</p>
      </LegalSection>
      <LegalSection title={t("legal.cgu_s7t")}>
        <p>
          {t("legal.cgu_s7a")}{" "}
          {contactEmail ? (
            <>{t("legal.cgu_s7write")} <a href={`mailto:${contactEmail}`} className="text-teal-700 dark:text-teal-300 hover:underline">{contactEmail}</a>{" "}</>
          ) : (
            <>{t("legal.cgu_s7form")} </>
          )}
          {t("legal.cgu_s7b")}
        </p>
      </LegalSection>
      <LegalSection title={t("legal.cgu_s8t")}>
        <p>{t("legal.cgu_s8a", { siteName })}</p>
        <p>{t("legal.cgu_s8b")}</p>
      </LegalSection>
      <LegalSection title={t("legal.cgu_s9t")}><p>{t("legal.cgu_s9")}</p></LegalSection>
      <LegalSection title={t("legal.cgu_s10t")}><p>{t("legal.cgu_s10")}</p></LegalSection>
      <LegalSection title={t("legal.cgu_s11t")}>
        <p>
          {t("legal.cgu_s11a")}{" "}
          {contactEmail ? (
            <>{t("legal.cgu_s11via")} <a href={`mailto:${contactEmail}`} className="text-teal-700 dark:text-teal-300 hover:underline">{contactEmail}</a>{" "}</>
          ) : (
            <>{t("legal.cgu_s11via")} {t("legal.cgu_s7form")} </>
          )}
          {t("legal.cgu_s11b")}
        </p>
      </LegalSection>
    </LegalPage>
  );
}
