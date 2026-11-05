import { Trans, useTranslation } from "react-i18next";
import LegalPage, { LegalSection } from "../components/layout/LegalPage";
import { useSiteSettings } from "../context/SiteSettingsContext";

export default function Confidentialite() {
  const { t } = useTranslation();
  const { contactEmail, siteName } = useSiteSettings();
  return (
    <LegalPage title={t("legal.privacyTitle")}>
      <LegalSection title={t("legal.pr_s1t")}>
        <p>
          {t("legal.pr_s1a", { siteName })}{" "}
          {contactEmail ? (
            <a href={`mailto:${contactEmail}`} className="text-teal-700 dark:text-teal-300 hover:underline">{contactEmail}</a>
          ) : (
            t("legal.pr_s1form")
          )}.
        </p>
      </LegalSection>
      <LegalSection title={t("legal.pr_s2t")}>
        <ul className="list-disc pl-5 space-y-1">
          <li><Trans i18nKey="legal.pr_s2a" components={{ strong: <strong /> }} /></li>
          <li><Trans i18nKey="legal.pr_s2b" components={{ strong: <strong /> }} /></li>
          <li><Trans i18nKey="legal.pr_s2c" components={{ strong: <strong /> }} /></li>
          <li><Trans i18nKey="legal.pr_s2d" components={{ strong: <strong /> }} /></li>
          <li><Trans i18nKey="legal.pr_s2e" components={{ strong: <strong /> }} /></li>
        </ul>
      </LegalSection>
      <LegalSection title={t("legal.pr_s3t")}>
        <ul className="list-disc pl-5 space-y-1">
          <li>{t("legal.pr_s3a")}</li><li>{t("legal.pr_s3b")}</li><li>{t("legal.pr_s3c")}</li><li>{t("legal.pr_s3d")}</li><li>{t("legal.pr_s3e")}</li>
        </ul>
      </LegalSection>
      <LegalSection title={t("legal.pr_s4t")}>
        <p>{t("legal.pr_s4a")}</p>
        <p>{t("legal.pr_s4b")}</p>
      </LegalSection>
      <LegalSection title={t("legal.pr_s5t")}>
        <p>{t("legal.pr_s5a")}</p>
        <p>{t("legal.pr_s5b")}</p>
      </LegalSection>
      <LegalSection title={t("legal.pr_s6t")}>
        <ul className="list-disc pl-5 space-y-1">
          <li>{t("legal.pr_s6a")}</li><li>{t("legal.pr_s6b")}</li><li>{t("legal.pr_s6c")}</li><li>{t("legal.pr_s6d")}</li>
        </ul>
      </LegalSection>
      <LegalSection title={t("legal.pr_s7t")}>
        <p>
          {t("legal.pr_s7a")}{" "}
          {contactEmail ? (
            <>{t("legal.pr_s7write")} <a href={`mailto:${contactEmail}`} className="text-teal-700 dark:text-teal-300 hover:underline">{contactEmail}</a>.</>
          ) : (
            t("legal.pr_s7form")
          )}{" "}
          {t("legal.pr_s7b")}
        </p>
        <p>{t("legal.pr_s7c")}</p>
      </LegalSection>
      <LegalSection title={t("legal.pr_s8t")}><p>{t("legal.pr_s8")}</p></LegalSection>
      <LegalSection title={t("legal.pr_s9t")}><p>{t("legal.pr_s9")}</p></LegalSection>
    </LegalPage>
  );
}
