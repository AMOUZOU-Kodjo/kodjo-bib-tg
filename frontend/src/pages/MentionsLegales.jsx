import { Trans, useTranslation } from "react-i18next";
import LegalPage, { LegalSection } from "../components/layout/LegalPage";
import { useSiteSettings } from "../context/SiteSettingsContext";

export default function MentionsLegales() {
  const { t } = useTranslation();
  const { contactEmail, siteName } = useSiteSettings();
  return (
    <LegalPage title={t("legal.mentionsTitle")}>
      <LegalSection title={t("legal.ml_s1t")}>
        <p><Trans i18nKey="legal.ml_s1a" values={{ siteName }} components={{ strong: <strong /> }} /></p>
        <p>
          {t("legal.ml_s1contact")}{" "}
          {contactEmail ? (
            <a href={`mailto:${contactEmail}`} className="text-teal-700 dark:text-teal-300 hover:underline">{contactEmail}</a>
          ) : (
            t("legal.ml_s1form")
          )}
        </p>
      </LegalSection>
      <LegalSection title={t("legal.ml_s2t")}>
        <p><Trans i18nKey="legal.ml_s2a" components={{ strong: <strong /> }} /></p>
        <p><Trans i18nKey="legal.ml_s2b" components={{ strong: <strong /> }} /></p>
      </LegalSection>
      <LegalSection title={t("legal.ml_s3t")}>
        <p>{t("legal.ml_s3a")}</p>
        <p>
          {t("legal.ml_s3b")}{" "}
          {contactEmail ? (
            <>{t("legal.ml_s3write")} <a href={`mailto:${contactEmail}`} className="text-teal-700 dark:text-teal-300 hover:underline">{contactEmail}</a>.</>
          ) : (
            t("legal.ml_s3form")
          )}
        </p>
      </LegalSection>
      <LegalSection title={t("legal.ml_s4t")}>
        <p>{t("legal.ml_s4a")}</p>
        <p>{t("legal.ml_s4b")}</p>
      </LegalSection>
      <LegalSection title={t("legal.ml_s5t")}><p>{t("legal.ml_s5")}</p></LegalSection>
    </LegalPage>
  );
}
